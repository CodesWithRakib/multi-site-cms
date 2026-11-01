# Scheduled Publishing Semantics

## Canonical Storage & Timezone Normalization

Scheduled publishing allows content authors to queue publications for automatic release at a designated moment in time.

### Invariant: UTC Canonical Instant

All scheduled timestamps are parsed, validated, and persisted in **Coordinated Universal Time (UTC)** within PostgreSQL `timestamptz` columns (`post_publications.scheduled_for`).

- Editors may submit timestamps with local timezone offsets (e.g., `2026-11-05T14:30:00+06:00` or `2026-11-05T08:30:00Z`).
- The backend normalizes the value to a JavaScript `Date` and stores the canonical UTC epoch timestamp.
- When retrieving publications, the UTC ISO-8601 string is delivered in the standard API envelope (`scheduledFor: '2026-11-05T08:30:00.000Z'`).

---

## Validation Rules

When an editor requests to schedule a publication (`POST /api/v1/sites/:siteId/publications/:publicationId/schedule`):

1. **Format Validation**: The payload `scheduledFor` must be a valid ISO-8601 timestamp conforming to the `IsISO8601` validator.
2. **Future Instant Requirement**: The target instant must be strictly in the future. The publishing engine enforces a minimum buffer of **+5 seconds** ahead of the current server UTC time (`Date.now() + 5000`).
3. **Past Instant Rejection**: Any timestamp in the past or within the immediate 5-second buffer is rejected with an HTTP `400 Bad Request` (`VALIDATION_ERROR`, message key `publication.scheduledInPast`).
4. **Site & Content Eligibility**: The post must be `approved`, the target site `active`, and the publication in an eligible state (`draft` or `in_review`).

---

## Rescheduling Semantics

Editors with `publication:schedule` permission may update the planned publication time for any pending scheduled publication (`POST /api/v1/sites/:siteId/publications/:publicationId/reschedule`):

- **State Pre-condition**: The publication must currently have `status = 'scheduled'`. If the publication was already published or cancelled, reschedule is rejected with `publication.notScheduled`.
- **New Instant Validation**: The new timestamp is subjected to the same future validation rules.
- **Audit Recording**: An audit entry `publication.reschedule` is persisted with the old and new scheduled timestamps and any optional editorial reason provided in the request body.

---

## Cancellation Semantics

If an editorial schedule must be aborted, the editor issues a cancellation (`POST /api/v1/sites/:siteId/publications/:publicationId/cancel-schedule`):

- **Target State**: The publication is safely reverted to `status = 'draft'`.
- **Scheduled Field Reset**: The `scheduled_for` column is set to `NULL`.
- **Idempotent Invalidation**: Because background workers look up rows matching `WHERE status = 'scheduled' AND scheduled_for <= NOW()`, clearing the timestamp and changing the status immediately and irrevocably invalidates any pending background worker execution without requiring distributed timer cancellation.
- **Audit Trail**: An audit record `publication.cancel_schedule` is created capturing the cancellation reason.

---

## Just-In-Time Execution Revalidation

Background workers do **not** blindly transition scheduled publications to published when their timestamp arrives. At execution time, the worker re-evaluates:

1. **Site Active State**: If the site was deactivated while the publication was waiting in the queue, publication is aborted.
2. **Post Approval**: If an administrator unapproved or deleted the post during the scheduling window, publication is aborted.
3. **Revision Integrity**: The pinned revision must still exist and be valid.

If pre-conditions fail, the publication is flagged or reverted to draft, preventing stale, unapproved, or unauthorized content from entering the public domain.
