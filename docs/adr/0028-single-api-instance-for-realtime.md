# ADR-0028: Single API instance for realtime updates

- Status: Accepted
- Date: 2026-11-05
- Owners: platform engineering
- Amends: [ADR-0020](0020-publishing-lifecycle-scheduled-engine-outbox-and-realtime.md) (realtime delivery)

## Context

Live updates reach browsers through Server-Sent Events. `RealtimeService`
keeps the broadcast stream and the replay history (last 50 events per site)
in process memory (TD-9). The outbox dispatcher claims each event with
`FOR UPDATE SKIP LOCKED`, so exactly one API instance broadcasts it. With two
or more instances, clients connected to the others never see that event, and
replay history is lost on every restart or deploy.

The deployment target (free-tier and small hosts, see
`docs/deployment/free-tier-deployment.md`) runs one API instance. Publishing,
scheduling, retention, and the outbox are already safe on several instances
(proven by `scheduled-worker-concurrency.integration-spec.ts` and the advisory
lock in the retention job); realtime is the only part that is not.

## Decision

1. Run **exactly one API instance** in every environment. Deployment guides
   state this as a hard limit, not a default.
2. Accept that SSE replay history is lost on restart: a reconnecting client
   gets the events published since that instance started. The public pages
   still render every published update through ISR, so nothing is lost
   permanently; only the "live" push is missed.
3. When a second instance is needed, implement fan-out with PostgreSQL
   `LISTEN/NOTIFY` (below) **before** scaling out.

## Alternatives considered

- **PostgreSQL `LISTEN/NOTIFY` now** — the dispatcher would `pg_notify` after
  commit and every instance would `LISTEN` and broadcast locally; replay would
  read recent completed `outbox_events` instead of memory. Needs one dedicated
  connection per instance and reconnect handling. Deferred: no current
  deployment needs it (YAGNI), and it is a contained change when it does.
- **Redis pub/sub** — adds a paid or self-managed service the platform does
  not otherwise need.
- **Sticky sessions** — do not help: the instance that broadcasts is the one
  that claimed the outbox event, not the one the client is connected to.

## Consequences

- Horizontal scaling of the API is blocked until the trigger below is met.
- Restarts drop in-memory replay; clients fall back to reloading content.
- Everything else (publishing, outbox, retention) already tolerates several
  instances, so scaling out later is limited to the realtime change.

## Future migration considerations

Trigger: a need for a second API instance (availability or load), or a product
requirement that live updates survive restarts. The change is local to
`RealtimeService` and the outbox dispatcher: publish with `pg_notify` after the
outbox transaction commits, subscribe on a dedicated connection per instance,
and serve replay from `outbox_events` (kept 30 days by the retention job).
