# ADR-0020: Publishing Lifecycle, Scheduled Engine, Transactional Outbox and Real-Time SSE

- Status: Accepted
- Date: 2026-11-01
- Owners: Application Security Engineer, Backend Architect, Systems Engineer

## Context

Following the implementation of the CMS core and Tiptap rich-text editing experience (Phases 06 and 07), the platform required a reliable, enterprise-grade publishing engine capable of:

1. Enforcing a strict, validated publication lifecycle across multiple independent sites (Travel Blog, Air Sports).
2. Supporting precise, timezone-aware scheduled publishing with cancellation and rescheduling capabilities.
3. Executing background processing with guaranteed at-least-once delivery without introducing expensive or fragile external message queue infrastructure (preserving the free-first hosting posture established in ADR-0006).
4. Eliminating distributed dual-write inconsistency between database state and external caches or notifications.
5. Invalidating frontend Next.js Incremental Static Regeneration (ISR) edge caches on demand.
6. Delivering low-latency real-time updates to Air Sports live update feeds.

## Decision

1. **Explicit 5-State Publication Lifecycle & Matrix**:
   - Establish five validated publication states: `draft`, `in_review`, `scheduled`, `published`, `archived`.
   - Update database check constraint `CHK_post_publications_status` to include `'in_review'`.
   - Centrally validate all state transitions via `isValidPublicationTransition()`; reject disallowed transitions with HTTP `400 Bad Request` (`VALIDATION_ERROR`).
   - Require granular capability permissions (`publication:publish`, `publication:schedule`, `publication:archive`, `post:update`) and enforce strict tenant-level site boundaries.

2. **Canonical UTC Scheduled Engine**:
   - Store canonical scheduled instants in UTC `timestamptz` (`post_publications.scheduled_for`), backed by partial index `IDX_post_publications_due`.
   - Enforce future instant validation ($\ge +5$ seconds ahead of current server UTC time) and reject past or malformed timestamps.
   - Implement safe cancellation by reverting status to `draft` and setting `scheduled_for = NULL`, immediately invalidating worker polling without distributed timer cancellation.
   - Revalidate site status, post approval status, and revision integrity at execution time.

3. **PostgreSQL `FOR UPDATE SKIP LOCKED` Background Workers**:
   - Implement `ScheduledPublicationWorker` (5s interval) and `OutboxDispatcherWorker` (3s interval) directly inside the NestJS modular monolith.
   - Use PostgreSQL's row-level `SELECT ... FOR UPDATE SKIP LOCKED` primitive to achieve concurrent, non-blocking, multi-instance worker execution without Redis or Celery.

4. **Transactional Outbox Pattern**:
   - Create `outbox_events` table via reviewed TypeORM migration `1793491206000-PublishingLifecycleAndOutbox.ts`.
   - Combine publication state changes, audit logs, and outbox event creation into a single atomic database transaction.
   - Index active events with partial index `IDX_outbox_events_due` on `(status, next_retry_at) WHERE status IN ('pending', 'processing')`.
   - Implement exponential backoff retry policy (5 retries) and route persistently failing events to `'dead_letter'` status.

5. **Targeted Next.js Cache Invalidation**:
   - Derive precise paths (`/`, `/[slug]`, `/categories/[slug]`, `/tags/[slug]`) from validated publication metadata via `CacheInvalidationService`.
   - Dispatch HMAC/shared-secret authenticated webhook requests (`x-revalidation-secret`) to target site on-demand revalidation endpoints.

6. **Server-Sent Events (SSE) for Real-Time Air Sports Feeds**:
   - Expose `@Sse()` endpoint at `GET /api/v1/realtime/:siteKey/stream`.
   - Strictly scope channels by site key to ensure complete tenant data isolation.
   - Guard against data leakage: drafts and unapproved revisions are never broadcast.
   - Maintain an in-memory 50-event circular buffer per site and expose `GET /api/v1/realtime/:siteKey/missed-updates` to support seamless mobile client reconnection.

7. **Proactive Observability**:
   - Expose `GET /api/v1/publishing/health` reporting pending scheduled publications, outbox backlog, dead-letter count, and active worker statuses.

## Consequences

- **Positive**:
  - Zero dual-write discrepancies between the database and edge caches.
  - Complete elimination of race conditions or duplicate publications during worker execution.
  - Preserved free-first hosting posture: no external message brokers or cache daemons required.
  - Resilient recovery: missed publications during service downtime catch up automatically on restart.
  - High observability through health metrics and dead-letter queue auditing.
- **Negative / Costs**:
  - Polling workers generate regular database read queries (mitigated by partial indexes and short queries).
  - Outbox table requires periodic vacuuming and archival of completed records in high-throughput deployments.
