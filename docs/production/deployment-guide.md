# Production Deployment Guide

This guide details the deployment architecture, configuration prerequisites, and repeatable release workflows for the `multi-site-cms` platform.

---

## 1. Production Topology

```mermaid
flowchart TD
    subgraph CDN ["Edge CDN / Reverse Proxy (Vercel / Cloudflare)"]
        TB_EDGE["Travel Blog (Edge Cache)"]
        AS_EDGE["Air Sports (Edge Cache)"]
        ADM_EDGE["Admin Shell (Edge CDN)"]
    end

    subgraph AppHosts ["Application Runtime Tier"]
        TB_APP["apps/sites/travel-blog (Next.js 16)"]
        AS_APP["apps/sites/air-sports (Next.js 16)"]
        ADM_APP["apps/admin (Next.js 16)"]
        API_APP["apps/api (NestJS Modular Monolith)"]
    end

    subgraph DataStorage ["Data & Event Tier"]
        PG[("PostgreSQL 18 Managed DB")]
        OBJ[("S3 / Compatible Object Storage")]
    end

    TB_EDGE --> TB_APP
    AS_EDGE --> AS_APP
    ADM_EDGE --> ADM_APP

    TB_APP -->|"HTTP GET /api/v1/public/* (Tag ISR 60s)"| API_APP
    AS_APP -->|"HTTP GET /api/v1/public/* + SSE Stream"| API_APP
    ADM_APP -->|"HTTP REST API + Cookies"| API_APP

    API_APP -->|"TypeORM Connection Pool (max: 10)"| PG
    API_APP -->|"File Storage via StorageProvider"| OBJ
```

| Deployment Unit              | Recommended Host           | Runtime / Framework               | Assigned Ports (Local / Prod)   |
| :--------------------------- | :------------------------- | :-------------------------------- | :------------------------------ |
| **`apps/api`**               | Railway / Render / AWS ECS | Node.js 22 LTS (Alpine Container) | Port 4000 (binds `0.0.0.0`)     |
| **`apps/admin`**             | Vercel / Cloudflare Pages  | Next.js 16 (Turbopack)            | Port 5000 / 443                 |
| **`apps/sites/travel-blog`** | Vercel / Cloudflare Pages  | Next.js 16 (Turbopack)            | Port 3001 / 443                 |
| **`apps/sites/air-sports`**  | Vercel / Cloudflare Pages  | Next.js 16 (Turbopack)            | Port 3002 / 443                 |
| **Database**                 | Supabase / Neon / RDS      | PostgreSQL 18.6                   | Port 5433 (Local) / 5432 (Prod) |

---

## 2. Environment Configuration Prerequisites

Before deploying any application, configure the host environment variables. Real production secrets must reside in the host's secret manager, never in git.

### API Environment (`apps/api`)

```ini
NODE_ENV=production
HOST=0.0.0.0
PORT=4000
API_PREFIX=api/v1
CORS_ORIGINS=https://admin.yourdomain.com,https://travel.yourdomain.com,https://airsports.yourdomain.com
DATABASE_URL=postgresql://user:password@db-host:5432/multi_site_cms_prod?sslmode=require
TRUST_PROXY=1
LOG_LEVEL=info
BODY_LIMIT=1mb
DOCS_ENABLED=false
```

### Admin Shell Environment (`apps/admin`)

```ini
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
```

### Public Websites Environment (`apps/sites/*`)

```ini
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_APP_URL=https://travel.yourdomain.com
REVALIDATE_SECRET=your_cryptographically_random_revalidation_secret
```

---

## 3. Ordered Deployment Sequence

Deployments must follow this strict ordering to maintain database backward compatibility and avoid zero-downtime failures:

### Step 1: Pre-Deployment Database Backup

Execute an automated snapshot before applying any schema migrations:

```bash
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -b -v -f pre_deploy_backup.dump
```

### Step 2: Database Migration Execution

Migrations run as an isolated pre-deploy step. They must **never** run automatically inside application initialization:

```bash
pnpm --filter @multi-site-cms/api db:migration:run
```

Verify migration status:

```bash
pnpm --filter @multi-site-cms/api db:migration:show
```

### Step 3: Deploy Backend API (`apps/api`)

1. Build the NestJS application:
   ```bash
   pnpm --filter @multi-site-cms/api build
   ```
2. Start the container with healthcheck monitoring:
   ```bash
   node dist/main.js
   ```
3. Verify Liveness and Readiness:
   ```bash
   curl -f http://localhost:4000/api/v1/health
   curl -f http://localhost:4000/api/v1/health/ready
   ```

### Step 4: Deploy Frontend Applications (`admin`, `travel-blog`, `air-sports`)

Deploy frontends to Vercel or your hosting platform using the root Turbo build pipeline:

```bash
pnpm build
```

Frontend deployment settings:

- Root directory: repository root
- Framework preset: Next.js
- Build command: `pnpm build` or `pnpm --filter @multi-site-cms/<app> build`
- Output directory: `.next`

---

## 4. Super Admin Provisioning

On a fresh production installation, bootstrap the initial Super Admin account via the operator CLI:

```bash
node apps/api/dist/database/cli/bootstrap-super-admin.js \
  --email "admin@yourdomain.com" \
  --password "YourStrongProductionPassword123!" \
  --name "Platform Super Admin"
```

_Note: This command is strictly idempotent for the designated email, refuses execution if another Super Admin exists, and writes an immutable bootstrap record to `audit_events`._

---

## 5. Post-Deployment Verification (Smoke Testing)

1. **API Readiness**: `GET /api/v1/health/ready` returns HTTP 200 with `status: "ready"` and `checks.database.status: "up"`.
2. **Admin Authentication**: Navigate to `https://admin.yourdomain.com/login`, sign in with Super Admin credentials, verify redirection to dashboard shell.
3. **Travel Blog Rendering**: Navigate to `https://travel.yourdomain.com`, verify home page masthead, article listings, and sitemap at `/sitemap.xml`.
4. **Air Sports Telemetry**: Navigate to `https://airsports.yourdomain.com`, verify telemetry status indicator transitions from `CONNECTING` to `LIVE`.
