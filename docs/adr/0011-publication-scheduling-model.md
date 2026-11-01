# ADR-0011: Publication state and scheduling without a job table

- Status: Accepted
- Date: 2026-11-01
- Owners: database + platform engineering

## Context

Air sports coverage is time-sensitive: an update is written, scheduled for the
start of a session, and must appear at the right moment. The travel blog schedules
editorial pieces. The system must also let a publication be removed from one site
without touching the other.

Some designs model scheduling as `status = 'scheduled'` alone, which loses "what
time was requested" and "when did it actually publish". Others add a generic job
table and a queue, which is a large amount of infrastructure to introduce before
any worker exists.

## Decision

**Publication state lives on `post_publications`, and scheduling is data, not a
job row.**

- Statuses: `draft`, `scheduled`, `published`, `archived`.
- `scheduled_for` is the requested instant; `published_at` is the actual instant.
  Both are `timestamptz`, and neither substitutes for the other.
- Check constraints enforce the pairing: `scheduled` requires `scheduled_for`;
  `published` requires `published_at`.
- A partial index `(scheduled_for) WHERE status = 'scheduled'` is the due-work
  scan, so a future worker never scans the whole table.
- Status and per-site metadata are independent per publication: unpublishing from
  one site cannot affect another.
- Editorial state of the content itself is separate (`posts.status`), so content
  can be approved while a site is still a draft.
- Duplicate processing is prevented by a conditional claim, not by a separate
  event table: the worker updates only where `status = 'scheduled'`, proceeds when
  exactly one row changed, and writes its audit event in the same transaction.
- No `scheduled_jobs` or `outbox_events` table in Phase 02. They arrive only if a
  concrete delivery requirement (webhooks, fan-out, retries) demands them.

## Alternatives considered

| Option                                  | Why not                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| Status flag only                        | Cannot distinguish requested from actual time; loses schedule history   |
| `scheduled_jobs` table now              | A second source of truth for state before any worker exists             |
| Cron + immediate publish at insert time | Not idempotent across instances; no way to cancel cleanly               |
| Per-site publication status on the post | Breaks independent publication; the model this platform exists to avoid |
| Database-level triggers publishing      | Hidden side effects, untestable, impossible to audit cleanly            |
| Outbox from day one                     | Correct for guaranteed delivery, unnecessary before consumers exist     |

## Consequences

Positive: one authoritative state, cancel-by-transition, observable delay between
requested and actual publication, cheap due-work query, idempotent worker pattern.

Negative: a worker must poll (or be nudged) — there is no push notification; and
publishing is not atomic with any external side effect until an outbox is added.

Accepted cost: poll-based scheduling initially. At low volume this is cheaper and
more debuggable than a queue.

## Future migration considerations

When external delivery is required (email, webhooks, search indexing), add an
outbox table written in the same transaction as the publication change, plus a
worker that retries. That is additive: this decision stays intact. If multiple
sites must publish the same content simultaneously, add a "publish group" concept
rather than copying bodies.
