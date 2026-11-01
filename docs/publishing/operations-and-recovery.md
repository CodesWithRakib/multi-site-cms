# Operational Health, Monitoring & Disaster Recovery

## Operational Health Endpoint

To support proactive platform observability, the publishing engine exposes a dedicated health and metrics endpoint:

```http
GET /api/v1/publishing/health HTTP/1.1
Authorization: Bearer <TOKEN>
```

_(Requires `publication:publish` capability)._

### Health Metric Payload

```json
{
  "data": {
    "pendingScheduledCount": 3,
    "outboxBacklogCount": 0,
    "outboxDeadLetterCount": 0,
    "scheduledWorkerRunning": true,
    "outboxWorkerRunning": true,
    "scheduledWorkerStats": {
      "processed": 142,
      "failed": 0
    },
    "outboxWorkerStats": {
      "processed": 512,
      "failed": 0
    }
  }
}
```

---

## Metric Alerting Thresholds

Production monitoring tools (e.g. Datadog, Prometheus, Grafana) should alert on the following conditions:

| Metric                                | Warning Threshold | Critical Threshold | Remediation                                                                      |
| ------------------------------------- | ----------------- | ------------------ | -------------------------------------------------------------------------------- |
| `outboxDeadLetterCount`               | $> 0$             | $\ge 5$            | Inspect `last_error` in `outbox_events`; check external webhook endpoint health. |
| `outboxBacklogCount`                  | $> 50$            | $> 200$            | Increase worker poll batch size or scale API worker processes.                   |
| `pendingScheduledCount` (due in past) | $> 0$             | $> 5$              | Check if `scheduledWorkerRunning` is true; inspect database connection pool.     |
| `scheduledWorkerRunning`              | -                 | `false`            | Scheduled worker died; restart API service.                                      |
| `outboxWorkerRunning`                 | -                 | `false`            | Outbox worker died; restart API service.                                         |

---

## Disaster Recovery & Downtime Catch-Up

### Scenario: Total API Service Downtime (e.g., 2-Hour Outage)

If the backend process is stopped during a deployment or unexpected outage, several scheduled publications will miss their exact target minute.

**Automatic Catch-Up Procedure**:

1. When the API process starts up, `ScheduledPublicationWorker` resumes polling.
2. The query selects all records matching `WHERE status = 'scheduled' AND scheduled_for <= NOW() ORDER BY scheduled_for ASC`.
3. The worker processes all overdue records chronologically in bounded batches of 10.
4. For each recovered publication:
   - Sets status to `'published'`.
   - Records `publishedAt` as the current recovery instant.
   - Generates an `outbox_events` record to trigger Next.js cache purging.
5. Zero manual database updates are necessary.

---

## Dead-Letter Queue Investigation & Replay

When an outbox event exceeds `max_retries` (default 5), it is marked `status = 'dead_letter'` with its final exception captured in `last_error`.

### Step 1: Query Dead-Letter Events

```sql
SELECT id, event_type, site_id, next_retry_at, retry_count, last_error, payload
FROM outbox_events
WHERE status = 'dead_letter'
ORDER BY created_at DESC;
```

### Step 2: Resolve Root Cause

Common causes:

- The target site revalidation URL was misconfigured or down.
- The `x-revalidation-secret` did not match the frontend secret.
- Network firewall rules blocked outgoing requests to port 3000/5000.

### Step 3: Replay Dead-Letter Events

Once the external issue is resolved, administrators can safely re-queue dead-letter events:

```sql
UPDATE outbox_events
SET status = 'pending',
    retry_count = 0,
    next_retry_at = CURRENT_TIMESTAMP,
    last_error = NULL
WHERE status = 'dead_letter'
  AND id = '<EVENT_UUID>';
```

The `OutboxDispatcherWorker` will automatically pick up the event on its next tick and dispatch it to consumers.
