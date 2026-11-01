# Transactional Outbox Pattern & Event Dispatch

## The Dual-Write Problem

When publishing content, the platform must guarantee two distinct actions:

1. Persisting the publication status change and audit trail in PostgreSQL.
2. Triggering external downstream effects (invalidating Next.js frontend edge caches and broadcasting SSE updates to live connected clients).

Performing an external HTTP webhook call inside the database transaction creates severe distributed failure modes:

- If the HTTP request succeeds but the database transaction subsequently fails or aborts, the frontend displays content that does not exist in the database (phantom publication).
- If the database commits but the HTTP request times out, the cache remains stale indefinitely.
- Slow external endpoints hold database connections open, exhausting the connection pool.

---

## Transactional Outbox Architecture

To provide **at-least-once delivery guarantees** with zero phantom updates, `multi-site-cms` implements the **Transactional Outbox Pattern**:

```
+-----------------------------------------------------------+
|                   DATABASE TRANSACTION                    |
|                                                           |
|  1. UPDATE post_publications SET status = 'published'     |
|  2. INSERT INTO audit_logs (...)                          |
|  3. INSERT INTO outbox_events (event_type, payload, ...)  |
|                                                           |
+-----------------------------------------------------------+
                             |
                             | commits atomically
                             v
                 +-----------------------+
                 |     outbox_events     |
                 +-----------------------+
                             |
                             | polled via FOR UPDATE SKIP LOCKED
                             v
               +---------------------------+
               |  OutboxDispatcherWorker   |
               +---------------------------+
                 /                       \
                /                         \
               v                           v
     +-------------------+       +-------------------+
     | CacheInvalidation |       |  RealtimeService  |
     |   (Next.js ISR)   |       |   (SSE Clients)   |
     +-------------------+       +-------------------+
```

---

## Schema & Performance Indexing

The `outbox_events` table is created via reviewed migration `1793491206000-PublishingLifecycleAndOutbox.ts`:

```sql
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type varchar(100) NOT NULL,
  event_version integer NOT NULL DEFAULT 1,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  publication_id uuid REFERENCES post_publications(id) ON DELETE SET NULL,
  post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 5,
  next_retry_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Partial Index for Constant-Time Polling:

```sql
CREATE INDEX "IDX_outbox_events_due" ON outbox_events ("status", "next_retry_at")
WHERE status IN ('pending', 'processing');
```

Because completed events are excluded from this partial index, the polling query performance remains independent of historical table size over time.

---

## Event Catalog

| Event Type                   | Triggering Lifecycle Action                  | Primary Downstream Consumers                                       |
| ---------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `publication.published`      | Content transitioned to `published`          | `CacheInvalidationService`, `RealtimeService`                      |
| `publication.unpublished`    | Content unpublished back to `draft`          | `CacheInvalidationService`                                         |
| `publication.archived`       | Content archived                             | `CacheInvalidationService`                                         |
| `airsports.update.published` | Specialized Air Sports live update published | `RealtimeService` (Air Sports channel), `CacheInvalidationService` |

---

## Exponential Backoff & Dead-Letter Handling

When an external consumer (such as a Next.js revalidation endpoint) fails or returns an HTTP 5xx error:

1. **Error Recording**: The error message and stack are captured in `last_error`.
2. **Retry Incrementation**: `retry_count` is incremented.
3. **Exponential Backoff**: If `retry_count < max_retries`, a new `next_retry_at` is calculated:
   $$\text{delay} = \text{base\_delay} \times 2^{\text{retry\_count}} \quad (\text{with base delay of 5s})$$
   - Attempt 1: 10s delay
   - Attempt 2: 20s delay
   - Attempt 3: 40s delay
   - Attempt 4: 80s delay
   - Attempt 5: 160s delay
4. **Dead-Letter Routing**: When `retry_count >= max_retries`, the event status transitions to `'dead_letter'`. Dead-letter events are preserved for manual investigation via the operational health endpoint.
