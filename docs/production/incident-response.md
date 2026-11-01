# Production Incident Response & Operational Runbook

This runbook establishes escalation paths, triage protocols, and recovery runbooks for production incidents affecting `multi-site-cms`.

---

## 1. Incident Severity Classification

| Severity          | Definition                                                                                                                                | Target Response  | Target Resolution | Examples                                                                                    |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------- | :--------------- | :---------------- | :------------------------------------------------------------------------------------------ |
| **P0 (Critical)** | Complete platform outage, cross-tenant data leakage, unauthenticated access to admin APIs, database corruption.                           | **< 15 minutes** | **< 2 hours**     | Database unreachable (`503`), tenant isolation breach, compromised Super Admin credentials. |
| **P1 (High)**     | Major degraded functionality, background publishing worker crash, outbox events backlog exceeding 1000 items, cache invalidation failure. | **< 30 minutes** | **< 6 hours**     | Scheduled publications not firing, SSE live stream disconnect storms, media upload failure. |
| **P2 (Medium)**   | Minor non-blocking defect, intermittent latency spikes, non-critical UI rendering anomaly.                                                | **< 2 hours**    | **< 24 hours**    | Tag archive layout glitch, slow search query, localized translation omission.               |

---

## 2. Emergency Operational Runbooks

### Runbook 1: Database Outage / Readiness Failure (`503 SERVICE_UNAVAILABLE`)

**Symptoms**: `/health/ready` returns HTTP 503; API logs report `Database readiness check failed`.
**Diagnostic Commands**:

1. Check database container status:
   ```bash
   docker ps -f name=multi-site-cms-postgres
   ```
2. Inspect database logs:
   ```bash
   docker logs --tail 50 multi-site-cms-postgres-1
   ```
3. Test connection manually:
   ```bash
   pg_isready -h localhost -p 5433 -U multi_site_cms
   ```

**Remediation**:

- If container crashed: `docker start multi-site-cms-postgres-1`.
- If connection pool saturated: Increase `DATABASE_POOL_SIZE` in `apps/api/src/database/database-options.ts` or kill idle queries:
  ```sql
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < NOW() - INTERVAL '5 minutes';
  ```

---

### Runbook 2: Scheduled Publication Backlog / Worker Stall

**Symptoms**: Articles scheduled in the past remain in status `'scheduled'`.
**Diagnostic Query**:

```sql
SELECT count(*) AS overdue_scheduled
FROM "post_publications"
WHERE "status" = 'scheduled'
  AND "scheduled_for" <= NOW();
```

**Remediation**:

1. Inspect API logs for `ScheduledPublicationWorker` errors:
   ```bash
   grep "ScheduledPublicationWorker" api.log
   ```
2. The worker automatically recovers on the next 5-second tick using `FOR UPDATE SKIP LOCKED`.
3. If an individual publication has invalid data causing repetitive failures, set its status back to draft:
   ```sql
   UPDATE "post_publications" SET "status" = 'draft' WHERE "id" = '<problematic_id>';
   ```

---

### Runbook 3: Outbox Dispatcher Lag & Dead-Letter Queue Recovery

**Symptoms**: Real-time updates or cache invalidation events are delayed.
**Diagnostic Query**:

```sql
SELECT status, count(*) FROM "outbox_events" GROUP BY status;
```

**Remediation for Dead-Letter Events**:
To inspect and re-queue dead-letter events after fixing the underlying webhook or downstream receiver:

```sql
-- Inspect failure reason
SELECT id, event_type, last_error, retry_count FROM "outbox_events" WHERE status = 'dead_letter';

-- Reset dead-letter events for re-dispatch
UPDATE "outbox_events"
SET "status" = 'pending', "retry_count" = 0, "next_retry_at" = NOW()
WHERE "status" = 'dead_letter';
```

---

### Runbook 4: Compromised Administrator Account Isolation

**Symptoms**: Unauthorized modifications detected in `audit_events`.
**Remediation Sequence**:

1. Immediately suspend the compromised user account:
   ```sql
   UPDATE "users" SET "status" = 'suspended' WHERE "email" = 'compromised@user.com';
   ```
2. Revoke all active sessions for that user across all devices:
   ```sql
   UPDATE "sessions" SET "revoked_at" = NOW() WHERE "user_id" = (SELECT id FROM users WHERE email = 'compromised@user.com');
   ```
3. Inspect the audit log for unauthorized modifications made during the breach window:
   ```sql
   SELECT created_at, action, entity_type, entity_id, ip_address, details
   FROM "audit_events"
   WHERE "user_id" = (SELECT id FROM users WHERE email = 'compromised@user.com')
   ORDER BY "created_at" DESC;
   ```

---

## 3. Post-Mortem Incident Report Template

Following any P0 or P1 incident, submit a post-mortem containing:

1. **Incident Summary**: Date, duration, affected services (`api`, `admin`, `travel-blog`, `air-sports`).
2. **Root Cause Analysis (5 Whys)**: Underlying cause of the failure.
3. **Detection & Response Timeline**: Timestamp of alert, triage, remediation, and resolution.
4. **Corrective Actions**: Preventative code fixes, schema changes, or monitoring alerts created.
