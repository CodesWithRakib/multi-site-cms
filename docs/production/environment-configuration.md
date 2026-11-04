# Environment Configuration & Secret Management Reference

This document serves as the canonical reference for all environment variables across applications in the `multi-site-cms` monorepo.

---

## 1. Principles of Configuration

1. **Environment Parity by Configuration**: The exact same application code and built bundles run in development, preview, staging, and production. No conditional logic branches like `if (process.env.NODE_ENV === 'production')` may work around configuration.
2. **Fail-Fast Startup Validation**: `apps/api/src/config/env.ts` parses and validates configuration against strict Zod schemas on startup. Missing or malformed required variables terminate the process immediately with an actionable error list.
3. **No Secrets in Source Control**: Zero credentials, private keys, or connection strings are tracked in git. Only `.env.example` templates with sanitized placeholders are committed.
4. **Client Exposure Boundaries**: Variables prefixed with `NEXT_PUBLIC_*` are bundled into client-side JavaScript by Next.js and are considered publicly visible. Server-only secrets (`DATABASE_URL`, `REVALIDATE_SECRET`) must never use the `NEXT_PUBLIC_` prefix.

---

## 2. API Environment Reference (`apps/api`)

Validated by [`parseEnv()`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/config/env.ts).

| Variable               | Type                        | Default (Local Dev)                                                                       | Production Requirement       | Description                                                                                                                                                          |
| :--------------------- | :-------------------------- | :---------------------------------------------------------------------------------------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`             | Enum                        | `development`                                                                             | Mandatory (`production`)     | Node execution environment (`development`, `test`, `production`).                                                                                                    |
| `HOST`                 | String                      | `0.0.0.0`                                                                                 | Optional (`0.0.0.0`)         | Network interface to bind HTTP listener to.                                                                                                                          |
| `PORT`                 | Integer                     | `4000`                                                                                    | Optional (`4000`)            | Network port to listen on.                                                                                                                                           |
| `API_PREFIX`           | String                      | `api/v1`                                                                                  | Optional (`api/v1`)          | Global route prefix without leading slash.                                                                                                                           |
| `DATABASE_URL`         | PostgreSQL URL              | `postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms`            | **MANDATORY**                | Full PostgreSQL connection string with credentials. In production, localhosts are prohibited.                                                                        |
| `CORS_ORIGINS`         | Comma-delimited URLs        | `http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5000` | **MANDATORY**                | Whitelisted web origins permitted to make credentialed browser calls. Localhost origins are rejected in production.                                                  |
| `TRUST_PROXY`          | Integer (0–10)              | `0`                                                                                       | Mandatory behind proxy (`1`) | Number of trusted upstream reverse proxies for Express IP and header resolution.                                                                                     |
| `LOG_LEVEL`            | Enum                        | `info`                                                                                    | Optional (`info`)            | Logging verbosity (`debug`, `info`, `warn`, `error`, `silent`).                                                                                                      |
| `BODY_LIMIT`           | String                      | `1mb`                                                                                     | Optional (`1mb`)             | Maximum request body limit for JSON and urlencoded parsers (e.g. `1mb`, `512kb`).                                                                                    |
| `DOCS_ENABLED`         | Enum (`true`/`false`)       | `false`                                                                                   | Optional (`false`)           | Explicitly enable OpenAPI Swagger documentation UI in production environments.                                                                                       |
| `API_BASE_URL`         | URL                         | `http://localhost:4000/api/v1`                                                            | **MANDATORY**                | Public API base URL incl. prefix, for absolute media and preview links. Localhost is rejected in production.                                                         |
| `STORAGE_PROVIDER`     | Enum (`local`/`cloudinary`) | `local`                                                                                   | Optional                     | `cloudinary` requires `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`, or `CLOUDINARY_URL`. No built-in credentials; boot fails if missing. |
| `PREVIEW_TOKEN_SECRET` | String (≥32 chars)          | random per process                                                                        | **MANDATORY**                | HMAC key for draft preview tokens. Production boot fails without it.                                                                                                 |
| `REVALIDATE_SECRET`    | String (≥16 chars)          | None                                                                                      | Recommended                  | Sent as `x-revalidate-secret` to each site's `POST /api/revalidate`. Must equal the sites' value.                                                                    |
| `SITE_REVALIDATE_URLS` | `siteKey=url` list          | empty                                                                                     | Optional                     | Revalidation target override (ADR-0026). Without it the API uses `https://<verified primary domain>`.                                                                |

---

## 3. Frontend Web Applications Reference

### Admin Dashboard (`apps/admin`)

| Variable              | Type | Default (Local Dev)            | Description                                                                |
| :-------------------- | :--- | :----------------------------- | :------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL  | `http://localhost:4000/api/v1` | Public REST API base URL used by RTK Query client.                         |
| `NEXT_PUBLIC_APP_URL` | URL  | `http://localhost:5000`        | Public URL of the admin application itself (used for redirects and links). |

### Travel Blog (`apps/sites/travel-blog`)

| Variable                    | Type   | Default (Local Dev)            | Description                                                                                                                               |
| :-------------------------- | :----- | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | URL    | `http://localhost:4000/api/v1` | Public REST API base URL.                                                                                                                 |
| `NEXT_PUBLIC_APP_URL`       | URL    | `http://localhost:3001`        | Public URL for OpenGraph tags, canonical links, and sitemaps.                                                                             |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email  | None                           | Public editorial address for `/contact` (mailto). When unset the page shows no address.                                                   |
| `REVALIDATE_SECRET`         | String | None                           | Must equal the API value. Checked against the `x-revalidate-secret` header on `POST /api/revalidate`; when unset the webhook returns 503. |

### Air Sports Website (`apps/sites/air-sports`)

| Variable              | Type   | Default (Local Dev)            | Description                                           |
| :-------------------- | :----- | :----------------------------- | :---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL    | `http://localhost:4000/api/v1` | Public REST API base URL for content fetching.        |
| `NEXT_PUBLIC_APP_URL` | URL    | `http://localhost:3002`        | Public URL for OpenGraph tags and canonical sitemaps. |
| `REVALIDATE_SECRET`   | String | None                           | Must equal the API value; see the Travel Blog row.    |

---

## 4. Secret Rotation Protocol

If a production credential or signing secret is exposed:

1. **Immediate Revocation**: Generate a new secret in the hosting provider's secret store.
2. **Redeploy Backend**: Trigger a redeployment of `apps/api` with the updated secret.
3. **Session Invalidation**: If database credentials or session signing keys were rotated, revoke active sessions via database query:
   ```sql
   UPDATE "sessions" SET "revoked_at" = NOW() WHERE "revoked_at" IS NULL;
   ```
4. **Audit Review**: Query `audit_events` for any abnormal privileged activity during the exposure window.
