# ADR-0017: Multi-site configuration and domain registry

- Status: Accepted
- Date: 2026-11-01
- Owners: Architecture, Multi-Tenant Core & Security

## Context

The `multi-site-cms` platform operates as a centralized multi-tenant content management system managing independent public frontends (e.g., `travel-blog`, `air-sports`). The core multi-site domain model requires:

1. **Tenant Registry & Lifecycle**: Managing sites across administrative lifecycles (`active`, `paused`, `archived`, `suspended`) without risking content or audit history deletion.
2. **Domain Registry & Normalization**: Supporting primary domains, domain aliases, preview domains, and DNS-based domain ownership verification.
3. **Structured Site Configuration**: Site-specific branding, acyclic navigation hierarchies, SEO defaults, and localization configuration without allowing dangerous inputs such as CSS injection or malicious URL schemes.
4. **Public Site Discovery & High-Performance Caching**: Fast runtime resolution of hostnames to active tenants with HTTP ETag (304 Not Modified) caching, without exposing private tenant configuration or security tokens.
5. **Strict Multi-Tenant Isolation**: Ensuring Client Admins can only view and configure assigned sites, returning `404 NOT FOUND` on unauthorized accesses to eliminate cross-tenant resource enumeration.

## Decision

We implement a dedicated multi-tenant core module in `apps/api/src/sites/` with shared validation in `packages/validation/src/index.ts`:

### 1. Site Lifecycle & Soft-Deletion Architecture

- Sites support four explicit statuses enforced by check constraint `CHK_sites_status`: `active`, `paused`, `archived`, `suspended`.
- Sites cannot be hard-deleted if they are currently `active` or possess content publications (`post_publications`).
- Soft-deletion archives the site (`status = 'archived'`), preserving all relational integrity, revisions, media references, and append-only audit event logs.
- Inactive sites (`paused`, `archived`, `suspended`) fail closed on public resolution and return `404 NOT FOUND`.

### 2. Domain Registry & RFC 1035 / RFC 1123 Normalization

- Hostnames are validated and normalized via `normalizeHostname` before persistence:
  - Case-insensitive ASCII Punycode normalization.
  - Stripping optional ports from local development hosts (e.g. `localhost:5000` -> `localhost`).
  - Strict rejection of URI paths, query parameters, fragments, user credentials, and wildcard domains (`*`, `*.example.com`).
  - RFC 1035 / 1123 DNS label regex verification (`^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$`).
  - PostgreSQL schema integrity backed by `CHK_site_domains_hostname_format` and unique constraint `UQ_site_domains_hostname`.

### 3. Single Primary Domain Enforcement

- A site has exactly one primary domain.
- Enforced at the database layer via partial unique index `UQ_site_domains_primary_per_site` on `(site_id) WHERE is_primary = true`.
- Promoting an alias to primary executes inside a PostgreSQL database transaction: demoting the current primary domain (`is_primary = false`) and setting the target domain (`is_primary = true`) atomically, preventing duplicate primary states or broken configurations.

### 4. Challenge-Based Domain Verification Workflow

- Domain records track verification state: `is_verified` (boolean), `verification_token` (cryptographically random 32-byte hex token), `verification_token_expires_at` (7-day TTL), and `verified_at` (timestamp).
- Verification challenge: The tenant creates a DNS TXT record containing `cms-verify=<verification_token>` on the root domain or designated verification subdomain.
- Super Admins can verify domains via `POST /api/v1/sites/:siteId/domains/:domainId/verify`, emitting an append-only audit log entry (`domain.verify`).

### 5. Domain Resolution Service

- `DomainResolutionService` resolves incoming HTTP hostnames (normalized) to active tenants.
- Only verified domains belonging to active sites resolve successfully.
- Reverse proxy headers (`X-Forwarded-Host`) are sanitized, taking precedence only when behind trusted infrastructure.
- Resolution failure returns `null`, causing public handlers to return standardized `404 NOT FOUND` envelopes.

### 6. Structured Configuration & Injection Prevention

- **Branding**: Validates hex (`#fff`, `#ffffff`) or functional CSS color formats (`rgb(...)`, `hsl(...)`). Arbitrary CSS injection fields are rejected. Media references are stored as UUID foreign keys, not transient signed URLs.
- **Navigation Hierarchy**: Validates navigation item trees using cycle detection (`validateNavigationItems`). Item URLs are strictly checked to allow only relative paths (`/`, `/about`) or absolute `http://` / `https://` URLs; dangerous schemes (`javascript:`, `data:`, `vbscript:`) are rejected.
- **SEO Defaults**: Title template validation (must contain `%s`), canonical hostname validation matching registered domains, and structured robots indexing policies.
- **Locales**: Validates default locale and supported locale arrays against standard BCP-47 identifiers (e.g., `en`, `bn`).

### 7. Public Configuration API & HTTP ETag Caching

- Public endpoints:
  - `GET /api/v1/public/sites/by-domain/:hostname`
  - `GET /api/v1/public/sites/:key/config`
- Private metadata, verification tokens, internal database flags, and user credentials are strictly stripped from the returned contract.
- Performance: Computes deterministic SHA-256 ETag across the public configuration payload. Emits `ETag` and `Cache-Control: public, max-age=300, stale-while-revalidate=600`.
- Supports conditional requests (`If-None-Match`): returns HTTP `304 Not Modified` with an empty body when cache is valid, saving bandwidth and serialization overhead.

### 8. Cross-Tenant Authorization & IDOR Protection

- Super Admin has global platform authority across all sites.
- Client Admins can only query or mutate assigned sites.
- When an Admin attempts to access an unauthorized site via ID or URL tampering, the API returns `404 NOT FOUND` instead of `403 FORBIDDEN`, preventing tenant resource enumeration.

## Alternatives Considered

| Option                                                | Why not                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic runtime CSS stylesheet generation in database | High security risk of CSS exfiltration / injection attacks (e.g. data theft via CSS attribute selectors). Replaced by structured color and token validation.   |
| Automatic domain verification upon submission         | Allows unauthorized actors to claim foreign domains and intercept traffic. Replaced by unpredictable cryptographic challenge tokens and explicit verification. |
| Application-only primary domain uniqueness check      | Subject to race conditions under concurrent requests. Replaced by a PostgreSQL partial unique index and transactional demotion/promotion.                      |
| Returning 403 FORBIDDEN on foreign site access        | Leaks the existence of tenant UUIDs and competitor sites to client admins. Replaced by 404 NOT FOUND tenant isolation.                                         |
| Real-time dynamic payload serialization without ETag  | Unnecessary database and compute overhead on high-traffic public frontend lookups. Replaced by SHA-256 ETag caching and 304 Not Modified responses.            |

## Consequences

- All tenant mutations and domain verification events produce append-only audit entries in `audit_events`.
- Public frontends can safely fetch tenant configuration via canonical hostnames with client-side and CDN-level HTTP caching.
- Zero possibility of cross-tenant resource leakage across Client Admin dashboard sessions.
