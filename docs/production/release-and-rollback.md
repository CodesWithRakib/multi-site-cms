# Release, Rollout & Rollback Runbook

This runbook establishes strict release criteria, zero-downtime deployment sequences, backward-compatibility guidelines, and emergency rollback procedures.

---

## 1. Pre-Release Quality Gates

A release candidate may only be promoted to production when all quality gates pass:

```bash
# 1. Code formatting
pnpm format:check

# 2. Static analysis across all 10 workspaces
pnpm lint

# 3. Strict TypeScript type check
pnpm typecheck

# 4. Unit & integration test suites
pnpm test

# 5. Playwright end-to-end regression scenarios
pnpm test:e2e

# 6. Production compilation across all 4 applications
pnpm build
```

---

## 2. Zero-Downtime Migration Policy (Expand and Contract)

To ensure zero-downtime releases where old and new API instances briefly run concurrently:

1. **Never drop columns or rename tables in the same release as the code update**:
   - **Phase 1 (Expand)**: Add the new column or table as nullable or with a default value.
   - **Phase 2 (Release)**: Deploy new application code that writes to the new column and reads from either.
   - **Phase 3 (Contract)**: In a subsequent release, backfill data and drop the deprecated column.
2. **Migrations run as a pre-deploy hook**: Migrations must be executed by an isolated deployment container before new web or API instances start receiving user traffic.

---

## 3. Rollback Decision Criteria

Trigger an immediate rollback if any of the following occur within 30 minutes of deployment:

- **API Error Rate**: 5xx HTTP response rate exceeds **1%** over a 5-minute rolling window.
- **Readiness Failure**: `GET /api/v1/health/ready` returns HTTP 503 for more than 2 consecutive minutes.
- **Critical Auth Failure**: Users or administrators are unable to log in or authenticate valid sessions.
- **Outbox Stalemate**: Outbox pending event count accumulates continuously without processing.

---

## 4. Rollback Execution Procedure

### Step 1: Frontend Application Rollback

Roll back frontend applications (`admin`, `travel-blog`, `air-sports`) in Vercel or your hosting dashboard:

- Instant rollback: Promote the previous known-good deployment alias to active production traffic with one click.
- Time required: < 30 seconds.

### Step 2: Backend API Application Rollback

Re-deploy the previous container image tag or commit SHA on your backend host:

```bash
docker pull your-registry/multi-site-cms-api:previous-stable-sha
docker tag your-registry/multi-site-cms-api:previous-stable-sha your-registry/multi-site-cms-api:latest
# Restart container
```

### Step 3: Database Migration Rollback Limitations & Caution

> [!CAUTION]
> **Never roll back a migration that has already accepted user data unless absolutely necessary.**
> Reverting a migration (`typeorm migration:revert`) drops columns created by the new version and will permanently discard any articles, revisions, or user updates submitted between deploy and rollback.

- If the database change was non-destructive (e.g. added an index or nullable column), leave the schema in place; the previous application version will ignore the extra column.
- If a schema revert is mandatory and verified non-destructive:
  ```bash
  pnpm --filter @multi-site-cms/api db:migration:revert
  ```
- If data corruption occurred, restore the pre-deployment snapshot per [Backup & Recovery Runbook](file:///C:/Sofof_tech_2026/multi-site-cms/docs/production/backup-and-recovery.md).
