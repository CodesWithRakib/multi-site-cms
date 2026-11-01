# 24. Production Readiness, Security Hardening & Zero-Downtime Deployment

Date: 2026-11-01

## Status

Accepted

## Context

The `multi-site-cms` platform encompasses a centralized NestJS modular monolith API (`apps/api`), an administrative dashboard shell (`apps/admin`), and two independent public websites: Travel Blog (`apps/sites/travel-blog`) and Air Sports (`apps/sites/air-sports`).

To prepare the platform for production deployment without compromising architectural integrity, we must establish:

1. Verified security hardening across identity, authorization, tenant isolation, and content rendering boundaries.
2. Verified database reliability with immutable TypeORM migrations, zero schema synchronization, and tested restore drills.
3. Durable publishing with transactional outbox workers and atomic row locking (`FOR UPDATE SKIP LOCKED`).
4. End-to-end integration verification with Playwright across all user journeys.
5. Repeatable zero-downtime release workflows and disaster recovery runbooks.

## Decision

1. **Strict Server-Side Authorization Boundary**:
   - Rely solely on server-side guards ([`AuthGuard`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/guards/auth.guard.ts), [`PermissionsGuard`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/guards/permissions.guard.ts), [`CsrfGuard`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/guards/csrf.guard.ts)) and database relational resolution.
   - All unauthorized cross-tenant requests return opaque `404 NOT_FOUND` responses to eliminate resource enumeration.
   - Super Admin bootstrap is restricted to an operator CLI script; no unauthenticated HTTP provisioning endpoint exists.

2. **Immutable Migration Pipeline & Zero Runtime Synchronization**:
   - Maintain `synchronize: false` across all development, staging, and production environments.
   - Migrations are reviewed, forward-compatible DDL scripts executed as an isolated pre-deploy step.
   - Verified point-in-time restore drills confirm full 21-table integrity.

3. **Multi-Tier Caching & Invalidation Architecture**:
   - Web applications employ Next.js tag-based ISR (`tags: ['<site>-content']`) with timed revalidation (30s–60s).
   - Authoritative content updates trigger outbox events that invoke secure revalidation webhooks (`/api/revalidate`).
   - Public content endpoints return SHA-256 ETags and support `304 NOT_MODIFIED` caching.

4. **16-Scenario Playwright End-to-End Suite**:
   - Implement comprehensive E2E tests in `e2e/platform.spec.ts` testing setup, admin login, travel blog delivery, scheduled publishing, air sports telemetry, and security regressions.

5. **Operational Runbooks & Incident Response Standards**:
   - Document formal runbooks for database recovery, worker stalls, outbox dead-letter queues, and compromised account isolation in `docs/production/`.

## Consequences

- **Positive**: Zero risk of schema drift or unintended DDL execution. Complete protection against stored XSS, IDOR, and privilege escalation. High performance through multi-tier caching and ETag validation.
- **Negative / Trade-Offs**: Requires running pre-deploy migration hooks before container startup. SSE streams require persistent container hosting (NestJS) rather than standard serverless lambdas.
