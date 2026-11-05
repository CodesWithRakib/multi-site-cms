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

| ID     | Severity | Area                                                                                                                                                                             | Status                                                                                                                                               |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| SEC-0  | Critical | Cloudinary credentials in source                                                                                                                                                 | Removed from code (Phase 1); **rotation required by owner**                                                                                          |
| SEC-1  | Critical | Preview token signing secret                                                                                                                                                     | Fixed (Phase 1)                                                                                                                                      |
| SEC-2  | High     | Preview token minting (IDOR)                                                                                                                                                     | Fixed (Phase 1)                                                                                                                                      |
| SEC-3  | Medium   | Preview `siteId` not bound                                                                                                                                                       | Fixed (Phase 1)                                                                                                                                      |
| SEC-4  | High     | Site revalidation webhooks                                                                                                                                                       | Fixed (Phase 1)                                                                                                                                      |
| SEC-5  | Medium   | CSRF exemption by substring                                                                                                                                                      | Fixed (Phase 1)                                                                                                                                      |
| SEC-6  | Medium   | Public write endpoints rate                                                                                                                                                      | Fixed: newsletter at API (Phase 1); comments in travel-blog proxy (Phase 2)                                                                          |
| SEC-7  | Low      | Non-constant-time HMAC check                                                                                                                                                     | Fixed (Phase 1)                                                                                                                                      |
| SEC-8  | Info     | Permission check without site                                                                                                                                                    | By design; full sweep done (Phase 2b) — found SEC-11, SEC-12                                                                                         |
| SEC-9  | Medium   | Comments published without moderation                                                                                                                                            | Fixed (Phase 2): pre-moderation                                                                                                                      |
| SEC-10 | Medium   | Test suite wrote to a real Cloudinary account                                                                                                                                    | Fixed (Phase 1)                                                                                                                                      |
| SEC-11 | High     | Cross-site post takeover via publication                                                                                                                                         | Fixed (Phase 2b)                                                                                                                                     |
| SEC-12 | High     | Admin comments not site-scoped (PII + moderation)                                                                                                                                | Fixed (Phase 2b)                                                                                                                                     |
| SEC-13 | High     | Dev seed script with hardcoded passwords that also reset existing accounts                                                                                                       | Fixed (Phase 3b)                                                                                                                                     |
| SEC-14 | Medium   | Login page lists privileged account emails in every environment                                                                                                                  | Fixed (Phase 3b)                                                                                                                                     |
| SEC-15 | High     | Last-Super-Admin invariant was check-then-act without locking: two concurrent deactivations could both pass and leave no active Super Admin (platform lockout).                  | Fixed (Phase 6): transaction + `pg_advisory_xact_lock`; deterministic lock test fails without the fix                                                |
| SEC-16 | Medium   | `PATCH /settings/platform` did not validate nested sections: any keys and types were merged into stored JSON.                                                                    | Fixed (Phase 6): nested DTOs, ranges, unknown keys rejected; partial updates never erase fields                                                      |
| SEC-17 | Low      | Uploaded SVG relied on a regex sanitizer when opened directly.                                                                                                                   | Fixed (Phase 6): `sandbox` CSP on SVG responses (helmet CSP already blocked inline script)                                                           |
| SEC-18 | High     | Platform settings (session TTL, lockout, password length, MFA, maintenance, upload limits) are stored but enforced nowhere; the admin UI suggests protections that do not exist. | Fixed (Phase 7, owner approved): settings enforced via `getPolicy()` with safe clamping; non-existent features removed; see backend/configuration.md |
| SEC-19 | High     | `POST /media/upload` had no multer size limit: any file was buffered fully in memory before the size check (memory exhaustion).                                                  | Fixed (Phase 7): 100 MB multer hard limit + settings limit                                                                                           |
| SEC-20 | Low      | Settings audit events took the IP from the raw `X-Forwarded-For` header (client-controlled).                                                                                     | Fixed (Phase 7): `req.ip` (honors `TRUST_PROXY`)                                                                                                     |
| SEC-21 | Medium   | Failed-login counter was read-modify-write; parallel wrong guesses could undercount and delay lockout.                                                                           | Fixed (Phase 7): atomic `UPDATE … + 1` (concurrency test)                                                                                            |

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

**Resolution (Phase 2, product decision 2026-11-04: pre-moderation).** New
comments are stored as `pending` (honeypot hits as `spam`, answered identically),
the column default is `pending` (migration `1793491211000`), and only approved
comments are listed. The travel-blog proxy limits submissions to 5/min per
client IP (in-memory, per instance: `src/lib/rate-limit.ts`). Tests:
`public-content.e2e-spec.ts`, `rate-limit.test.ts`.

### SEC-10 — API tests uploaded to a real Cloudinary account

`config/env.ts` loads `apps/api/.env`, and `test/setup-env.ts` did not pin the
storage provider, so `media-upload.e2e-spec.ts` uploaded test images to the
developer's real Cloudinary account (seen in the baseline run, where the
returned URL was `res.cloudinary.com/...`). The setup file now forces
`STORAGE_PROVIDER=local` and blanks all Cloudinary variables.

### SEC-11 — Publishing another site's post granted access to it

- Evidence (before fix): `PublicationsService.createPublication` checked only
  the _target_ site. A site-B admin who knew a post id that existed only on
  site A could publish it on site B; `canAccessPost` then passed (the post had
  a publication on an authorized site), exposing all revisions and edits.
  `archivePost` additionally archived **every** publication, so that admin
  could take site A's article offline.
- Fix: `createPublication` requires `canAccessPost` on the post (opaque 404);
  `archivePost` requires authority over every site the post is published on
  (403). Shared rules in `apps/api/src/posts/utils/post-access.ts`.
- Tests: `preview.e2e-spec.ts` › "Cross-site post isolation" (9 cases; the two
  regression cases fail on the old code, verified by stashing the fix).

### SEC-12 — Admin comment moderation ignored site membership

- Evidence (before fix): `CommentsAdminService` took no actor. `GET /comments`
  without `siteId` returned every site's comments including commenter emails;
  `PATCH /comments/:id/status`, `DELETE /comments/:id`, and `POST /comments/batch`
  acted on any comment id.
- Fix: list is filtered to the caller's sites (Super Admin: all); by-id
  operations return 404 outside scope; a batch is rejected whole if any id is
  unknown or out of scope.
- Tests: `comments-admin.e2e-spec.ts` (7 cases; 4 fail on the old code).

### SEC-8 sweep result (Phase 2b)

Checked every id-addressed method in `posts.service.ts`, `publications.service.ts`,
`publishing.service.ts`, `media.service.ts`, `comments-admin.service.ts`,
`audit.service.ts`, `analytics.service.ts`, `dashboard.service.ts`:
publication and publishing lookups are all scoped by `(id, siteId)`; media
checks the asset's site; audit, analytics, and dashboard filter by the caller's
sites. The two gaps found are SEC-11 and SEC-12 above. Minor: analytics and
dashboard default a multi-site admin to their first site only (UX, not a leak).

### SEC-13 — `provision-site-admins.ts` hardcoded passwords and reset accounts

- Evidence (before fix): `pnpm db:seed:admins` hashed three literal passwords
  (Super Admin, Travel Admin, Air Sports Admin), created a Super Admin despite
  the documented bootstrap policy, and on **existing** accounts overwrote the
  password and set `status = 'active'` — so running it against a shared
  database would reset passwords and reactivate suspended users. No production
  guard existed.
- Fix: refuses `NODE_ENV=production`; password from `DEV_SITE_ADMIN_PASSWORD`
  (min 12 chars, no default); creates only missing **site** Admins and never
  modifies existing users; Super Admins only via `bootstrap:super-admin`.
- Owner action: if the old script was ever run on a shared or production
  database, rotate those accounts' passwords. The literals remain in Git history.

### SEC-14 — Login page advertised privileged accounts

- Evidence (before fix): `apps/admin/src/app/login/page.tsx` always rendered a
  "Local Development Accounts" list with the Super Admin email — including in
  production, which helps targeted password attacks.
- Fix: removed; development accounts belong in local docs, not the UI.

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
- Dependency scan (`pnpm audit`, 2026-11-05): 0 high/critical. 1 moderate in production-dependency graph (`minimatch` ReDoS via `eslint-config-next`, lint-time only) and 1 moderate + 1 low in dev tooling (`glob`, `deepmerge` via Jest). None reach a runtime bundle; accepted until upstream updates. Re-run before each release.
