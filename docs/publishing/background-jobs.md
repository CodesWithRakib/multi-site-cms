# Background Jobs & Polling Infrastructure

## Architecture & Hosting Posture

In alignment with **ADR-0006 (Free-First Hosting Posture)** and **ADR-0011 (Publication Scheduling Model)**, `multi-site-cms` avoids heavy, expensive, or fragile cloud dependencies (such as managed Redis clusters, Celery, or RabbitMQ) for scheduled job processing.

Instead, the platform implements a high-throughput, transactional background worker engine running directly within the NestJS modular monolith, backed by PostgreSQL's native concurrency primitives.

---

## PostgreSQL `FOR UPDATE SKIP LOCKED`

To ensure safe, multi-instance execution without race conditions, deadlocks, or duplicate task execution, all background workers leverage PostgreSQL's `SELECT ... FOR UPDATE SKIP LOCKED`:

```sql
SELECT id FROM post_publications
WHERE status = 'scheduled'
  AND scheduled_for <= NOW()
ORDER BY scheduled_for ASC
LIMIT 10
FOR UPDATE SKIP LOCKED;
```

### Key Concurrency Properties:

1. **Row-Level Mutual Exclusion**: When Worker A selects a due publication, PostgreSQL places an exclusive row-level lock on that row.
2. **Non-Blocking Contention**: If Worker B queries the database concurrently, `SKIP LOCKED` instructs PostgreSQL to immediately bypass the rows locked by Worker A and claim the next available rows. Neither worker blocks or waits for locks.
3. **Safe Horizontal Scaling**: Multiple API instances or replica processes can run workers simultaneously without generating duplicate publications.

---

## Core Background Workers

### 1. `ScheduledPublicationWorker`

Responsible for transitioning due scheduled publications to the `published` state.

- **Cadence**: Evaluates every **5,000 ms** (5 seconds).
- **Batch Size**: Bounded to **10 records** per poll tick to prevent memory spikes or transaction timeouts.
- **Workflow**:
  1. Identifies candidate IDs with `FOR UPDATE SKIP LOCKED`.
  2. For each candidate, executes an isolated transaction:
     - Verifies site status, post status, and revision validity.
     - Updates publication status to `'published'`, records `publishedAt = NOW()`, and clears `scheduled_for = NULL`.
     - Writes a `publication.publish` event into `outbox_events`.
     - Records an entry in `audit_logs`.
  3. Increments internal performance metrics (`processedCount`, `failedCount`).

### 2. `OutboxDispatcherWorker`

Responsible for processing transactional outbox records and triggering external integrations.

- **Cadence**: Evaluates every **3,000 ms** (3 seconds).
- **Batch Size**: Bounded to **20 events** per poll tick.
- **Workflow**:
  1. Claims pending outbox events where `status = 'pending'` or `(status = 'processing' AND next_retry_at <= NOW())` with `FOR UPDATE SKIP LOCKED`.
  2. Transitions claimed events to `processing`.
  3. Dispatches event payloads to:
     - Next.js cache revalidation webhook endpoints (`CacheInvalidationService`).
     - Real-time SSE streaming channels (`RealtimeService`).
  4. Upon success, marks the event `completed` with `processedAt = NOW()`.
  5. Upon failure, calculates exponential backoff and schedules retry or routes to `dead_letter`.

---

## Worker Lifecycle & Graceful Shutdown

Both workers implement NestJS lifecycle hooks:

```typescript
export class ScheduledPublicationWorker implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    if (process.env.NODE_ENV !== 'test') {
      this.start();
    }
  }

  onModuleDestroy(): void {
    this.stop();
  }
}
```

- **Graceful Shutdown**: When SIGTERM or SIGINT is received, `stop()` clears the active interval timer. Any transaction currently executing within the tick completes before the database connection pool shuts down.
- **Restart Recovery**: If an instance crashes abruptly during execution, PostgreSQL rolls back the uncommitted transaction automatically, releasing the row lock. Upon restart, the next polling tick immediately discovers and claims the due record.
