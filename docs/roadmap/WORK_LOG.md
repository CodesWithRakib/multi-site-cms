# Work Log

## 2026-11-04 — Audit + Phase 1

**Baseline:** lint pass, typecheck pass, `pnpm test` failed (API 4 failed / 211 passed).

**Code changes (uncommitted):**

- `apps/api/src/config/env.ts` — `PREVIEW_TOKEN_SECRET` (required in production),
  `REVALIDATE_SECRET`, empty-as-unset secrets, Cloudinary credential validation,
  `resolveCloudinaryCredentials()`.
- `apps/api/src/posts/posts.service.ts` — preview key from env (random outside
  production), object-level check on token minting, signed `siteId` binding,
  constant-time comparison.
- `apps/api/src/auth/guards/csrf.guard.ts` — exact-path login exemption.
- `apps/api/src/posts/public-content.controller.ts` — newsletter throttle 5/min.
- `apps/api/src/media/storage/cloudinary-storage.provider.ts`,
  `local-storage.provider.ts` — removed hardcoded credentials and cloud name.
- `apps/api/src/publishing/cache/cache-invalidation.service.ts` — env-based
  secret, `x-revalidate-secret` header, `skipped` result instead of fake success.
- `packages/config/src/revalidation.ts` (+ test, + `./revalidation` export).
- `apps/sites/{travel-blog,air-sports}/src/app/api/revalidate/route.ts` —
  POST-only, fail-closed, validated payload.
- Tests: `test/setup-env.ts` (local storage pinned, preview secret),
  `config.spec.ts`, `csrf.guard.spec.ts`, `preview.e2e-spec.ts`, `openapi.e2e-spec.ts`.
- `.env.example` for API and both sites.

**Docs:** `docs/audit/*` (11 files), `docs/roadmap/*` (5 files),
`docs/publishing/cache-invalidation.md`, `docs/production/environment-configuration.md`,
`docs/backend/configuration.md`, superseded banners on two production reports.

**Migrations:** none.

**Verification:**

- `pnpm lint` exit 0, `pnpm typecheck` exit 0.
- `pnpm test`: API 22 suites / 221 tests passed; config 21, travel-blog 6,
  air-sports 10, admin 11, ui/validation/api-client/redux passed.
- Preview regression tests: 3 failed on the old `posts.service.ts`
  (temporarily stashed), 8/8 pass on the new one.
- `turbo build` for API, travel-blog, air-sports: success.
- Not run: Playwright E2E, browser checks, `pnpm audit`.

**Note:** the user committed unrelated WIP as `e4f26de` during the session; the
Phase 1 files were staged in the index by the editor, not by the agent.

## 2026-11-04 — Phase 2a (after business decisions)

**Decisions (user):** no commerce; comment pre-moderation; contact via
`mailto:`; revalidation target = env override else verified primary domain.

**Code changes (uncommitted):**

- Comments: `public-comments.service.ts` stores `pending` (honeypot → `spam`,
  same response); new `SubmittedPublicComment` type in `@multi-site-cms/types`;
  travel-blog `CommentForm.tsx` / `lib/comments.ts` show "awaiting review".
- Migration `1793491211000-PreModeratedComments.ts`: default `pending`, composite
  FK `FK_post_comments_publication_site`, pre-check aborts on inconsistent rows.
  Entity default updated. **Not yet applied to the developer database.**
- Travel-blog `src/lib/rate-limit.ts` + comments proxy: 5/min per client IP, 429 with `Retry-After`.
- Contact: `src/app/contact/page.tsx` (server component + metadata),
  `components/contact/ContactForm.tsx`, `lib/contact.ts`; `NEXT_PUBLIC_CONTACT_EMAIL`.
- Revalidation: `SITE_REVALIDATE_URLS` env, `CacheInvalidationService.resolveSiteBaseUrl`,
  dispatcher passes the URL, `redirect: 'error'`, error text capped, article
  paths `/articles/[slug]` + `/articles`. ADR-0026.
- Tests: `public-content.e2e-spec.ts` (+4), `cache-invalidation.e2e-spec.ts` (11),
  `config.spec.ts` (+6), `schema.integration-spec.ts` (+2, migration round-trip),
  stale counts in `wiring/schema.integration-spec.ts`, travel-blog `rate-limit.test.ts`, `contact.test.ts`.

**Verification:** lint 0, typecheck 0; `pnpm test` all 9 tasks green (API
242/242); `test:integration` 56/56; travel-blog and API production builds OK;
Prettier clean on all changed files. Not run: Playwright, browser checks.

## 2026-11-04 — Phase 2b

**Decision (user):** newsletter = collect emails only for now.

**Findings fixed:**

- SEC-11 (High): publishing another site's post granted access to it; archiving
  a post archived other sites' publications. `posts/utils/post-access.ts`
  (`canAccessPost`, `canManageAllPublications`) used by `PostsService` and
  `PublicationsService`.
- SEC-12 (High): admin comment list/moderation ignored site membership (all
  sites' commenter emails visible; cross-site approve/delete/batch).
  `CommentsAdminService` now takes the actor and scopes every operation.
- TD-4: `auth/utils/resolve-request-site-id.ts` shared by both guards.
- TD-7: `API_BASE_URL` in the validated env (required, non-localhost in production);
  four direct `process.env` reads removed.

**Tests added:** `comments-admin.e2e-spec.ts` (7), "Cross-site post isolation"
block in `preview.e2e-spec.ts` (9), `resolve-request-site-id.spec.ts` (3),
`config.spec.ts` (+2). Old-code check: SEC-11 cases 2/2 and SEC-12 cases 4/7
fail when the fix is stashed.

**Verification:** lint 0, typecheck 0, `pnpm test` 9/9 tasks (API 263/263),
`test:integration` 56/56, Prettier clean. Not run: Playwright, browser checks.

**Migrations:** none new in 2b.

## 2026-11-04 — Phase 3a (UX resilience)

**Changes (uncommitted):**

- `packages/ui`: new `StatusPage` (+ test); `toggle-group.tsx` marked `'use client'` (UX-9).
- Both sites: `not-found.tsx`, `error.tsx`, `global-error.tsx`; `PillButton` uses `cn()` (UX-10).
- Admin: `not-found.tsx`, `error.tsx`, `global-error.tsx` with EN/BN `boundary` keys;
  `/taxonomy` wrapped in Suspense — admin production build was failing at HEAD (UX-8).
- Air Sports: `/articles` paginated index, header link, sitemap entry (UX-4);
  `PopularAirSports` from CMS categories, invented ratings/reviews/favorites removed (UX-3).
- `e2e/route-boundaries.spec.ts` (11 tests).
- Tried `loading.tsx` on detail routes, removed it: streaming turned unknown slugs into HTTP 200.

**Verification:** lint 0, typecheck 0, all unit/API tests (API 263), all three
apps build, **first real Playwright run: 27/27 passed** (one earlier attempt had a
cold-compile timeout; re-runs clean). Old-code checks: overflow test fails with
the old `PillButton` (70 px / 12 px); slug test caught the soft-404 regression.

**Process note:** an over-broad `prettier --write` reformatted 17 unrelated
air-sports files; each was proven format-only (Prettier of the index blob ==
worktree) and restored from the index. A repo-wide check found no other
format-only changes.

## 2026-11-04 — Phase 3b (central theme, dark mode, mobile app shell)

**Request (user):** proceed; centralized color theme changeable any time for
all apps; review how the full system looks; app-like feel on phones.

**Changes (uncommitted):**

- `packages/ui/src/theme/`: `site-themes.ts` (the one place to change colors,
  OKLCH → hex), `theme.css` (derived scales, light/dark tokens, palette
  aliases), `theme-provider.tsx` (shared, defaults to system), `theme-script.ts`,
  `app-icon.tsx`; `components/mobile-tab-bar.tsx`; base touch styles and
  `pb-tabbar` utility in `styles.css`. Tests: 43 in the UI package.
- All three apps: token blocks removed from `globals.css`; layouts set theme
  inputs on `<html>`, run the theme script via `next/script`, derive
  `theme-color`, add `appleWebApp`; new `manifest.ts`, `icon.tsx`,
  `apple-icon.tsx`, `icons/[name]/route.tsx`; local theme providers deleted.
- Admin: 114 hex classes → `brand-*`; login/unauthorized/auth guard on
  semantic tokens; dev-account list removed (SEC-14).
- Sites: `AppTabBar` bottom navigation; header search hidden on phones;
  safe-area headers; `CategoryBadge linked` prop (nested-link fix); Travel
  hero real stats; Air Sports search field readable.
- API: `provision-site-admins.ts` rewritten (SEC-13); `DEV_SITE_ADMIN_PASSWORD`.
- E2E: `mobile-app.spec.ts` (11), `visual-tour.spec.ts` (opt-in).
- Docs: ADR-0027, design-system "Changing colors", audits.

**Verification:** lint 0, typecheck 0, unit tests all green (UI 43, API 263),
three app builds OK, **E2E 38 passed** (12 opt-in visual-tour tests skipped).
Visual review of 60 + 60 screenshots (before/after).

**Not done / blocked:** authenticated admin screens not reviewed — creating a
temporary admin in the dev database was denied by the permission system;
needs the user's local credentials. Repo-wide formatting (145 files) left for a
separate commit (TD-10).

## 2026-11-05 — Phase 3c (authenticated admin review)

**Environment:** Docker Desktop was not running; started it. `pnpm db:up`
without `POSTGRES_PORT` recreated the container on 5432 while `apps/api/.env`
uses 5433 (login failed with "unexpected error"); restored with
`POSTGRES_PORT=5433 pnpm db:up`, data intact (named volume). The dev database
was **3 migrations behind** (`PlatformSettingsRegistry`, `NewsletterSubscribers`,
`PreModeratedComments`); applied with `db:migration:run`.

**Changes (uncommitted):** dashboard metrics from real data (analytics API for
page views), `DashboardMetricItem` without default trend/sparkline, upsell card
removed, permission-aware sidebar, `/settings` guarded by `platform:configure`,
`AdminTabBar` + safe-area padding in `ShellLayout`, two-column stat grids on
phones (7 components), short tab labels (EN/BN), `e2e/admin-roles.spec.ts`.

**Verification:** lint 0, typecheck 0, unit tests green (admin 12, UI 43,
API 263), admin build OK, **E2E 42 passed** (role tests run with local
accounts via env). Old-code check: site-admin sidebar test fails without the fix.

**Note:** E2E logins share the API's 5-per-minute login limit; role specs log
in once per role. `Sidebar.tsx` was already unformatted at HEAD and was
formatted as part of this change.

## 2026-11-05 — Phase 3d (accessibility, keyboard, posts decomposition)

**Decision (user):** add any needed dependency without asking; the user commits.

**Changes (uncommitted):**

- Dev dependency `@axe-core/playwright@4.14.0` (root).
- Theme: brand ramp 500–900 and neutral 500 darkened for WCAG AA; contrast
  guard tests in `site-themes.test.ts` (UI tests 57).
- Admin contrast codemods (light-only text steps, dark variants for class strings
  without one), 10 `aria-label`s on selects, editor textbox name, language button
  name, logo accessible names (sites), Travel/Air badge and chip fixes.
- `SkipLink` (UI package) in all apps with `#main-content`; `aria-expanded`/
  `aria-controls` on menu toggles; visible focus rings where outlines were hidden;
  Escape closes the admin drawer.
- `/posts` decomposed: `usePostsWorkspace` + `PostsWorkspaceHeader`,
  `PostsStatsCards`, `PostsStatusTabs`, `PostsFilterBar`, `PostsTable`,
  `PostTableRow`, `PostRowActions`, `PostStatusCell`, `PostThumbnail`,
  `PostsPagination`, `utils/post-display.ts` (+ tests).
- API: post list returns `author { id, displayName }` (join selects only those
  columns) and fetches latest revisions in one `DISTINCT ON` query instead of
  one query per post. Type `PostAuthorSummary`. Test in `cms-core.e2e-spec.ts`.
- E2E: `accessibility.spec.ts`, `keyboard.spec.ts`, `support/admin-session.ts`
  (one login per account per run, shared via test-results/.auth).

**Verification:** see the final gate in this session's summary (lint,
typecheck, unit, API, integration, E2E with local accounts).

## 2026-11-05 — Phase 4 (production operations)

**Baseline:** clean tree (Phase 3 committed by the owner).

**Code changes (uncommitted):**

- Repository formatted with Prettier (142 files, format-only; TD-10).
  `next-env.d.ts` added to `.prettierignore` (Next rewrites it per mode).
- `.github/workflows/ci.yml` — `verify` gets a PostgreSQL service and runs DB
  integration tests; new `e2e` job (production builds, seeded DB, throwaway
  accounts, API started before sites are built).
- `playwright.config.ts` — `E2E_SERVER_MODE=production`, `E2E_REUSE_SERVERS`.
- API: `GET /posts/stats` (`PostsService.getPostStats`, `scopedPostsQuery`,
  `utils/effective-status.ts`); list status filter uses the same SQL rule.
- API: `src/maintenance/` — `RetentionJob` (+ module, env windows).
- API: `src/database/cli/remove-generated-analytics.ts` +
  `db:cleanup:generated-analytics`; migration `1793491207000` no longer inserts
  generated page views (schema unchanged).
- Types: `PostStatsStatus`, `PostStatusCounts`.
- Admin: `useGetPostStatsQuery`; `usePostsWorkspace` uses server counts, no
  client re-filtering; `displayedPublication` precedence matches the API;
  `usePostRowModel`, `PostTypeBadge`, `PostCard` (phones); `useId` for menu
  and SVG gradient ids.
- Tests: `scheduled-worker-concurrency`, `retention`, `generated-analytics`
  integration specs; `cms-core` stats/filter tests; `post-display` tests;
  `e2e/admin-posts.spec.ts`; OpenAPI path list.

**Verification:** format pass, lint pass, typecheck pass, `pnpm test` all
packages pass (API 267/267, admin 19), integration 67/67. Playwright against
production builds (`next start`, local): first full run 43 passed / 7 failed
because the dev API restarted while API files were being edited; the 7 failed
specs re-run: 27/27 passed. Restore drill: dump 0.8 s, restore 1.3 s, source
and copy identical.

**Finding DB-6:** all 4,468 page views in the development database were
generated by migration `1793491207000` (matched by `xmin`). Not deleted —
owner decision.

**Docs:** ADR-0028; backup-and-recovery (drill log, stale counts fixed);
data-ownership (retention, cleanup); testing.md (server modes, CI); audit
registers (TD-8/9/10/12/14 fixed, TD-15, DB-4 fixed, DB-6, dependency scan);
PRODUCTION_READINESS 8.5/10; free-tier deployment (one API instance).

## 2026-11-05 — Phase 6 (coverage and hardening backlog)

**Baseline:** Phase 4 committed (`8588690`); tree clean.

**Code changes (uncommitted):**

- `posts/public-content.service.ts` — newsletter: atomic `INSERT … ON CONFLICT`,
  message names the site, audit metadata without the email.
- `users/users.service.ts` — last-Super-Admin checks inside a transaction with
  `pg_advisory_xact_lock`; revoke from an inactive Super Admin allowed; roles
  batch-loaded for the user list.
- `settings/dto/update-platform-settings.dto.ts` — nested validated DTOs;
  `settings.service.ts` merges only defined fields.
- `media/media.controller.ts` — sandbox CSP for SVG.
- Admin posts: `PostRowActions` on Radix `DropdownMenu`; `DeletePostDialog`,
  `WorkspaceNoticeBanner`; hook without menu state or native dialogs.
- Tests: `users-and-roles.e2e-spec.ts` (8), `platform-settings.e2e-spec.ts`
  (12), newsletter block in `public-content.e2e-spec.ts` (7), SVG/PNG CSP
  assertions, `e2e/admin-posts.spec.ts` (menu above tab bar, keyboard, delete
  dialog cancel).

**Verification:** format, lint, typecheck pass; tests: API 294, admin 19, ui 57,
config 21, travel 21, air 13, validation 12, api-client 5, redux 3; integration
67/67; Playwright posts + keyboard + accessibility 12/12 (dev servers). Lock
test fails with the lock removed (mutation check), passes with it.

**Found, not changed (owner decision):** SEC-18 — platform settings are stored
but enforced nowhere.

## 2026-11-05 — Phase 7 (enforced platform settings)

**Owner decisions:** wire platform settings into auth/media (approved); delete
generated analytics on the dev DB (approved).

**Data:** dev DB `analytics_page_views` backed up (`/tmp/analytics_before_cleanup.dump`
in the Postgres container), dry run 4,468, `--apply` deleted 4,468; table now empty.

**Code changes (uncommitted):**

- API: `settings/platform-policy.ts` (policy, clamping, safe defaults, password
  rule), `SettingsService.getPolicy()` (15 s cache, invalidated on save),
  `GET /settings/policy`; DTO without MFA/registration/S3/WebP, audit ≥ 365;
  mapper exposes documented fields only; audit IP from `req.ip`.
- Auth: lockout from policy with atomic counter; session TTL/idle from policy,
  checked against session age; cookie max-age from the session.
- Users: password policy on create/update. Media: settings size/types on
  upload and registration; multer 100 MB limit. Posts: default status, preview
  TTL, revision pruning. Retention: audit days from settings; env var removed.
- Types/validation: `EffectivePlatformPolicy`; removed unimplemented fields.
- Admin: settings forms without unimplemented controls; audit options ≥ 1 year;
  `useGetEffectivePolicyQuery`; `AutosaveScheduler` + `maxWaitMs`; diagnostics
  placeholder no longer claims Cloudinary.
- UI: `MaintenanceBanner`. Sites: `SiteMaintenanceBanner` in both layouts.
- Tests: `platform-policy.e2e-spec.ts` (6), `test/unit/platform-policy.spec.ts`
  (6), `autosave-scheduler.test.ts` (3), `maintenance-banner.test.tsx` (2),
  OpenAPI path list.

**Verification:** format, lint, typecheck pass; tests: API 306, admin 22, ui 59,
travel 21, air 13, config 21, validation 12, api-client 5, redux 3; integration
67/67; Playwright 54/54 (dev servers). Maintenance banner verified in a
browser (appeared after 24 s; maintenance switched off again afterwards).

## 2026-11-05 — Phase 8 (admin decomposition and UX correctness)

**Baseline:** Phase 7 committed; tree clean.

**Code changes (uncommitted):**

- Admin shared: `components/feedback` (`ConfirmDialog`, `ActionNotice`,
  `useActionNotice`), `components/navigation/Pagination`, `lib/api-error.ts`.
- Sites: `features/sites` (hooks `useSiteDetail`, `useSitesRegistry`; utils
  `site-url`, `sites-registry`; components header, general form, domains panel,
  add-domain form, DNS dialog, card, card art, stats, filters). Pages rewritten.
- Users: `features/users/roles.ts`; hooks `useUsersDirectory`, `useUserDetail`;
  components profile card, roles card, assign-role dialog; stats cards from the
  API; filter bar and edit modal use real roles/statuses; `/users/new` fixed.
- Media, taxonomy, comments: confirmations and notices instead of native dialogs.
- Posts: shared feedback components; `currentData` with loading/error states.
- API: `GET /users/stats`; users list `search` (LIKE-escaped), `roleKey`,
  `siteId`; category/tag in-use 409; IANA timezone validation on sites.
- Tests: site-url, sites-registry, roles, api-error unit tests; users e2e
  (search/filters/stats), cms-core (409), OpenAPI path list.

**Verification:** format, lint, typecheck, tests (API 308, admin 31, ui 59,
travel 21, air 13, config 21, validation 12, api-client 5, redux 3),
integration 67/67, web build, Playwright on production builds 54/54 twice (a
first run had one failure traced to stale RTK data; fixed).
