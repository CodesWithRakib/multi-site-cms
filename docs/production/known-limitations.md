# Known Limitations, Technical Debt & Prioritized Follow-Up Backlog

This document records operational limitations, hosting platform constraints, and a prioritized engineering backlog for subsequent maintenance cycles.

---

## 1. Hosting & Infrastructure Constraints

### 1. Free-Tier Database Connection Ceiling

- **Constraint**: Free-tier managed PostgreSQL providers (e.g. Supabase, Neon) typically cap concurrent client connections at **20–60**.
- **Current Architecture Mitigation**: `DATABASE_POOL_SIZE` is capped at **10** connections per API instance in `apps/api/src/database/database-options.ts`.
- **Scaling Threshold**: Running more than 2 API instances concurrently requires enabling PgBouncer (connection pooler) or upgrading the database tier.

### 2. Persistent Server-Sent Events (SSE) on Serverless Runtimes

- **Constraint**: Next.js serverless functions (e.g. on standard Vercel tiers) enforce execution timeouts (15s–60s) and cannot hold persistent HTTP SSE connections.
- **Current Architecture Mitigation**: The Air Sports SSE live stream endpoint (`/api/v1/realtime/:siteKey/stream`) is hosted directly on the persistent NestJS container runtime, which sustains persistent HTTP streaming indefinitely with a 25-second ping heartbeat.
- **Edge Upgrade Path**: For massive live spectator events (>10,000 concurrent listeners), terminate SSE at an edge proxy (Cloudflare Workers or AWS CloudFront) backed by Redis Pub/Sub.

### 3. Local Media Storage vs. S3 Cloud Storage

- **Constraint**: The default storage provider stores media in the local filesystem (`STORAGE_LOCAL_DIR`). In multi-instance or auto-scaling container topologies, uploaded files on one instance are not accessible to another instance.
- **Production Path**: Deploy an S3-compatible storage adapter (AWS S3, Cloudflare R2, MinIO) implementing the existing [`StorageProvider`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/media/storage/storage-provider.interface.ts) interface.

---

## 2. Prioritized Engineering Backlog

### P1 — High Priority (Near-Term Production Hardening)

1. **S3 / Cloudflare R2 Object Storage Provider**:
   - Implement S3 storage provider behind [`StorageProvider`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/media/storage/storage-provider.interface.ts) to support multi-container API deployments with persistent media uploads.
2. **PgBouncer Connection Pooling Integration**:
   - Document transaction-mode PgBouncer connection strings for high-concurrency PostgreSQL operations.
3. **Structured OpenTelemetry Tracing**:
   - Integrate OpenTelemetry SDK in `apps/api` for distributed trace propagation across outbox background jobs and HTTP controllers.

### P2 — Medium Priority (Feature & Operational Enhancements)

1. **Automated Dead-Letter Queue Dashboard in Admin**:
   - Expose an administrative UI in `apps/admin` under `/settings/publishing` allowing Super Admins to inspect and re-trigger failed outbox events without manual database queries.
2. **Multi-Region Read Replica Routing**:
   - Configure TypeORM master/slave data sources to route public read queries (`/public/sites/:siteKey/*`) to read replicas.
3. **Automated Accessibility Testing in CI**:
   - Add `@axe-core/playwright` to the Playwright E2E suite to automatically audit WCAG 2.2 AA accessibility violations on every pull request.
