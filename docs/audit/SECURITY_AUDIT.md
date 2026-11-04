# Security Audit

- Audit date: 2026-11-04
- Scope: `apps/api`, `apps/sites/*` route handlers, `apps/admin` auth flow
- Method: source inspection of guards, services, and route handlers; findings
  below are verified by reading the code paths end to end. Severity follows
  likely exploitability in a default production deployment.

The earlier report [docs/production/security-audit.md](../production/security-audit.md)
rates every capability "VERIFIED / Low". This audit found issues that report
did not cover; treat this file as the current source of truth.

## Findings

| ID     | Severity | Area                                          | Status                                                      |
| ------ | -------- | --------------------------------------------- | ----------------------------------------------------------- |
| SEC-0  | Critical | Cloudinary credentials in source              | Removed from code (Phase 1); **rotation required by owner** |
| SEC-1  | Critical | Preview token signing secret                  | Fixed (Phase 1)                                             |
| SEC-2  | High     | Preview token minting (IDOR)                  | Fixed (Phase 1)                                             |
| SEC-3  | Medium   | Preview `siteId` not bound                    | Fixed (Phase 1)                                             |
| SEC-4  | High     | Site revalidation webhooks                    | Fixed (Phase 1)                                             |
| SEC-5  | Medium   | CSRF exemption by substring                   | Fixed (Phase 1)                                             |
| SEC-6  | Medium   | Public write endpoints rate                   | Partly fixed: newsletter (Phase 1); comments open (Phase 2) |
| SEC-7  | Low      | Non-constant-time HMAC check                  | Fixed (Phase 1)                                             |
| SEC-8  | Info     | Permission check without site                 | Open (by design, documented)                                |
| SEC-9  | Medium   | Comments published without moderation         | Open — product decision                                     |
| SEC-10 | Medium   | Test suite wrote to a real Cloudinary account | Fixed (Phase 1)                                             |

### SEC-0 — Real Cloudinary API key and secret committed to source

- Evidence (before fix): `apps/api/src/media/storage/cloudinary-storage.provider.ts`
  used literal fallbacks for `cloud_name`, `api_key`, and `api_secret` when the
  env variables were absent. Introduced in commit `6f55f4f`. The values are not
  repeated here.
- Impact: anyone with repository access (or any build artifact) can upload,
  overwrite, and delete assets in that Cloudinary account.
- Fix in code: no built-in credentials. `STORAGE_PROVIDER=cloudinary` now
  requires `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
  or a valid `CLOUDINARY_URL`; boot fails otherwise (`parseEnv`).
- **Owner action required:** rotate the API secret in the Cloudinary console
  and update local `.env` files. The old value remains in Git history; removing
  it from history needs a history rewrite, which needs explicit approval and
  is pointless without rotation. No Git remote is configured in this clone, so
  the exposure may be limited to people with a copy of the repository.

### SEC-1 — Preview HMAC secret falls back to a constant committed to the repo

- Evidence (before fix): `apps/api/src/posts/posts.service.ts` `getPreviewSecret()`
  returned `process.env.SESSION_SECRET || 'preview-secret-key-multi-site-cms-development-2026'`.
  `SESSION_SECRET` is not part of the validated schema in
  `apps/api/src/config/env.ts`, not in `apps/api/.env.example`, and not in the
  production required-variable list.
- Impact: in a production deploy that follows the documented env reference, the
  signing key is public. `GET /api/v1/posts/:postId/preview` is `@Public()`, so
  anyone who knows or guesses a post UUID (UUIDs appear in admin URLs, logs,
  screenshots) can forge a token and read the latest unpublished draft revision.
- Fix: `PREVIEW_TOKEN_SECRET` is now a validated env variable (min 32 chars).
  Production boot fails when it is missing. Non-production uses a per-process
  random key, so tokens never validate against a known constant.

### SEC-2 — Any admin could mint a preview token for any post

- Evidence (before fix): `PostsService.generatePreviewToken` checked only the
  optional `siteId` query parameter; it never called `canAccessPost`. The route
  requires `post:read`, which `PermissionsGuard` grants when the user holds it on
  _any_ site (`AuthorizationService.hasPermission` without `siteId`).
- Impact: a site Admin for site A could read drafts of posts that belong only to
  site B — a cross-tenant data leak, contradicting ADR-0016 and
  [content-authorization.md](../content/content-authorization.md).
- Fix: the service loads the post's publications and applies `canAccessPost`;
  unauthorized callers receive the same opaque 404 as a missing post.

### SEC-3 — Preview `siteId` query parameter overrode the signed site

- Evidence (before fix): `getPostPreview(postId, token, siteId)` used
  `siteId || tokenSiteId`, so a valid token could be replayed against another
  site to read that site's publication metadata and domain.
- Fix: if a `siteId` is supplied it must equal the signed site; otherwise 401.

### SEC-4 — Revalidation webhooks: hardcoded fallback secret and fail-open

- Evidence (before fix):
  - `apps/sites/travel-blog/src/app/api/revalidate/route.ts` accepted
    `process.env.REVALIDATE_SECRET || process.env.SESSION_SECRET || 'revalidate-secret-key-multi-site-cms-2026'`,
    accepted the secret from the query string, and exposed `GET`.
  - `apps/sites/air-sports/src/app/api/revalidate/route.ts` skipped the check
    entirely when `REVALIDATE_SECRET` was unset (fail-open).
  - `apps/api/src/publishing/cache/cache-invalidation.service.ts` sent a
    different header (`x-revalidation-token`), a different env name
    (`REVALIDATION_SECRET`), and its own fallback `'dev_revalidation_secret'`.
- Impact: unauthenticated cache purges (cost and availability abuse on
  ISR-backed sites); secrets in query strings end up in access logs.
- Fix: one contract — `POST` only, header `x-revalidate-secret`, env
  `REVALIDATE_SECRET`, constant-time comparison, fail closed (503) when the
  secret is not configured. Shared helper in `@multi-site-cms/config`.
- Remaining (functional, not security): the API never passes a site base URL to
  `revalidatePaths`, so on-demand revalidation is a no-op that reports success.
  Tracked as FEAT-PUB-3 in [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md).

### SEC-5 — CSRF guard exempted any URL containing `/auth/login`

- Evidence (before fix): `CsrfGuard` used `url.includes('/auth/login')` on
  `originalUrl`, which includes the query string. `POST /api/v1/posts?x=/auth/login`
  with a session cookie skipped Origin and double-submit checks.
- Mitigation that existed: `SameSite=Lax` cookies block most cross-site POSTs,
  but not same-site origins (e.g. sibling subdomains of the public sites).
- Fix: compare the request path (without query string) exactly against
  `/{API_PREFIX}/auth/login`.

### SEC-6 — Public comment and newsletter endpoints used only the global limit

- Evidence: `POST public/sites/:siteKey/posts/:slug/comments` and
  `POST public/sites/:siteKey/newsletter` had no `@Throttle`; the global limit is
  120 requests/min/IP.
- Fix (newsletter): 5 requests/min/IP. Browsers call this endpoint directly, so
  the IP is the reader's.
- Not fixed (comments): the travel blog proxies comment submissions through its
  own route handler (`apps/sites/travel-blog/src/app/api/articles/[slug]/comments/route.ts`),
  so the API sees one server IP for all readers and stores that IP on the
  comment. A per-IP limit at the API would throttle every reader together.
  Phase 2: rate-limit in the site route handler, or forward the client IP from a
  trusted proxy with an authenticated header.

### SEC-7 — Preview signature compared with `!==`

- Fix: `crypto.timingSafeEqual` on equal-length buffers.

### SEC-8 — Site-less permission checks (documented, not changed)

`AuthorizationService.hasPermission` without a `siteId` returns true when the
user holds the permission on any site. This is intentional for canonical posts
(which are not owned by a single site), so object-level checks in services are
mandatory. Every service method touching a post must call `canAccessPost`. This
audit confirmed it for archive and fixed the missing case in preview-token
minting (SEC-2); a full sweep of every `PostsService` / `PublicationsService`
method is scheduled for Phase 2. New endpoints must follow the same rule.

### SEC-9 — Public comments are visible immediately

`PublicCommentsService.createComment` stores new comments as `approved` unless a
heuristic flags spam; the column default is also `approved`
(`1793491210000-PostComments.ts`). With no effective rate limit (SEC-6), this
lets anyone post links or abusive text that appears on the site at once.
Choosing pre-moderation (`pending` by default) vs post-moderation is a product
decision; see [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

### SEC-10 — API tests uploaded to a real Cloudinary account

`config/env.ts` loads `apps/api/.env`, and `test/setup-env.ts` did not pin the
storage provider, so `media-upload.e2e-spec.ts` uploaded test images to the
developer's real Cloudinary account (seen in the baseline run, where the
returned URL was `res.cloudinary.com/...`). The setup file now forces
`STORAGE_PROVIDER=local` and blanks all Cloudinary variables.

## Verified controls (no change needed)

- Session tokens are random, stored as SHA-256 hashes; cookies are `HttpOnly`,
  `SameSite=Lax`, `Secure` in production (`apps/api/src/auth/auth.controller.ts`).
- Login throttled to 5/min (`@Throttle` on `POST auth/login`).
- Inactive accounts fail closed and their session is revoked (`AuthGuard`).
- Site-scoped routes resolve membership from the database each request and
  return 404 on cross-tenant access (`SiteAccessGuard`, `AuthorizationService`).
- Global guards order: Throttler → CSRF → Auth → Permissions (`app.module.ts`).
- Production env validation rejects missing `DATABASE_URL` / `CORS_ORIGINS` and
  localhost CORS origins (`apps/api/src/config/env.ts`).

## Not yet reviewed in depth (next security pass)

- Media upload pipeline and SVG sanitizer (`apps/api/src/media/*`) — the test
  suite covers it; a manual review against polyglot files is pending.
- `GET media/assets/*` path handling in the local storage provider.
- Users module role assignment paths for privilege escalation.
- Dependency vulnerability scan (`pnpm audit`) — not run in this session.
