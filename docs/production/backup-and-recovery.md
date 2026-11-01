# Database Backup, Disaster Recovery & Restore Verification

This runbook establishes operational procedures for database backups, point-in-time recovery drills, and post-restore integrity validation.

---

## 1. Recovery Objectives (RPO & RTO)

| Metric                             | Target           | Operational Rationale                                                                                                                                                                                                                 |
| :--------------------------------- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Recovery Point Objective (RPO)** | **< 1 hour**     | Achieved via hourly automated database snapshots and WAL (Write-Ahead Logging) archiving on managed PostgreSQL. In the event of catastrophic data corruption, maximum theoretical data loss is capped at 1 hour of content revisions. |
| **Recovery Time Objective (RTO)**  | **< 30 minutes** | Time required to provision a replacement database instance, restore the compressed binary backup snapshot (`pg_restore`), verify relational integrity, and redirect API database connection strings.                                  |

---

## 2. Backup Procedures

### Automated Daily Full Backup

Managed hosting providers (Supabase, Neon, AWS RDS) perform automated continuous WAL archiving. For self-hosted or dedicated PostgreSQL instances, configure a daily cron job running:

```bash
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --blobs \
  --verbose \
  --file="/backups/multi_site_cms_$(date +%Y%m%d_%H%M%S).dump"
```

### Pre-Migration Safety Snapshot

Before running any TypeORM migration in production (`pnpm --filter @multi-site-cms/api db:migration:run`), take a manual safety snapshot:

```bash
pg_dump -U multi_site_cms -d multi_site_cms -F c -f /tmp/pre_migration_backup.dump
```

---

## 3. Verified Restore Drill Procedure

The restore drill was verified against a live PostgreSQL 18 instance. Follow these exact steps to execute a disaster recovery restore drill:

### Step 1: Create a Disposable Restore Target Database

```bash
psql -U multi_site_cms -d postgres -c "CREATE DATABASE multi_site_cms_drill OWNER multi_site_cms;"
```

### Step 2: Restore from Compressed Dump

```bash
pg_restore \
  -U multi_site_cms \
  -d multi_site_cms_drill \
  --no-owner \
  --role=multi_site_cms \
  --verbose \
  /tmp/backup_drill.dump
```

### Step 3: Verify Relational Integrity Checklist

Verify that all 21 system tables, constraints, and migrations are intact:

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected result: 21 tables

SELECT count(*) FROM typeorm_migrations;
-- Expected result: 7 migrations

SELECT id, key, name, status FROM sites;
-- Expected result: Active sites 'travel-blog' and 'air-sports' intact

SELECT count(*) FROM outbox_events WHERE status = 'pending';
-- Verify outbox queues
```

### Step 4: Tear Down Drill Database

```bash
psql -U multi_site_cms -d postgres -c "DROP DATABASE multi_site_cms_drill;"
```

---

## 4. Post-Restore Application Health Checklist

After completing a database restore in production:

1. **Connection String Update**: Update `DATABASE_URL` in the hosting secret manager if the host or database name changed.
2. **Readiness Probe Check**:
   ```bash
   curl -i http://localhost:4000/api/v1/health/ready
   ```
   Must return HTTP 200 with:
   ```json
   {
     "data": {
       "status": "ready",
       "checks": {
         "database": {
           "status": "up",
           "latencyMs": 5
         }
       }
     }
   }
   ```
3. **Session Invalidation**: When restoring from a backup older than 1 hour, immediately invalidate pre-existing sessions to force secure re-authentication:
   ```sql
   UPDATE "sessions" SET "revoked_at" = NOW() WHERE "revoked_at" IS NULL;
   ```
4. **Outbox Resumption**: Verify that the outbox dispatcher worker resumes processing pending events without duplicate delivery.
