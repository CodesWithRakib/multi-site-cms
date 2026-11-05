# Phase Status

Last updated: 2026-11-05 (Phase 9)

| Phase                                           | Status                                  | Evidence / blocker                                                                                                                                                             |
| ----------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 — Audit                                       | Done                                    | `docs/audit/*`                                                                                                                                                                 |
| 1 — Secrets and security hardening              | **Done in code; one owner action open** | Open: rotate Cloudinary secret (SEC-0)                                                                                                                                         |
| 2 — Core workflow correctness                   | **Done** (one coverage item deferred)   | API 263/263, integration 56/56. Deferred to Phase 4: API tests for newsletter, users/roles, settings                                                                           |
| 3 — UX resilience                               | **Done (3a–3d)**                        | WCAG 2.2 AA: 0 serious/critical (axe, light+dark, public+admin); keyboard flows tested; `/posts` decomposed. E2E 51/51. Remaining page decompositions moved to Phase 4 backlog |
| 4 — Production operations                       | **Done in code; owner/CI checks open**  | API 267/267, integration 67/67, E2E full suite green on production builds locally. Open: first GitHub CI run, DB-6 cleanup decision, provider PITR drill                       |
| 5 — Commerce                                    | **Out of scope**                        | Business decision 2026-11-04                                                                                                                                                   |
| 6 — Coverage and hardening backlog              | **In progress**                         | API 294/294, integration 67/67, E2E posts/keyboard/axe 12/12. Open: SEC-18 decision, TD-5 decompositions, TD-13 other screens                                                  |
| 7 — Enforced platform settings                  | **Done**                                | Owner approved (SEC-18). API 306/306, integration 67/67, E2E 54/54 (dev servers), maintenance banner verified in browser                                                       |
| 8 — Admin decomposition and UX correctness      | **Done**                                | API 308/308, integration 67/67, admin 31, E2E 54/54 on production builds (twice)                                                                                               |
| 9 — Deployment readiness (Neon, Render, Vercel) | **In progress**                         | Code ready: proxy, bootstrap, timeouts, password change, phone, runbook. API 311, integration 71. Waiting: admin URL, Render env/start command, first Super Admin              |

Phases 1–3 are committed by the owner; Phase 8 changes are uncommitted.

## Phase 1 checklist

- [x] SEC-0 Cloudinary credentials removed from source; env validation added
- [ ] SEC-0 Secret rotated in Cloudinary (**owner**)
- [x] SEC-1, SEC-2, SEC-3, SEC-4, SEC-5, SEC-7, SEC-10
- [x] SEC-6 newsletter throttle
- [x] Stale OpenAPI test updated; docs corrected

## Phase 2 checklist

- [x] 2a Revalidation wired (ADR-0026), redirects refused, article paths fixed
- [x] 2a SEC-9 comment pre-moderation; SEC-6 comment rate limit in the travel-blog proxy
- [x] 2a DB-1 composite FK; migration round-trip test; stale integration counts fixed
- [x] 2b SEC-8 object-level sweep across 8 services → fixed SEC-11 and SEC-12
- [x] 2b TD-4 shared site-ID resolver for guards
- [x] 2b TD-7 `API_BASE_URL` validated; required and non-localhost in production
- [ ] API tests for newsletter, users/roles, settings (coverage only; moved to Phase 4)

## Phase 3 checklist

- [x] FEAT-TB-9 contact page: `mailto:`, server component with metadata
- [x] UX-1 `not-found`, `error`, `global-error` in all three apps (shared `StatusPage`)
- [x] UX-3 `PopularAirSports` from CMS categories; invented ratings/reviews removed
- [x] UX-4 Air Sports `/articles` index with pagination, nav link, sitemap entry
- [x] UX-8 admin production build fixed (`/taxonomy` Suspense boundary)
- [x] UX-9 `toggle-group` marked `'use client'` (dev crash on every route)
- [x] UX-10 mobile horizontal overflow on both sites (`PillButton` + `cn()`)
- [x] Browser verification of 404 pages at 1440 / 768 / 375 (screenshots reviewed)
- [x] 3b Central theme (ADR-0027): one `site-themes.ts` for all apps, derived tokens, palette aliasing, admin hex codemod
- [x] 3b Dark mode follows the OS; shared theme provider; no flash (`next/script`)
- [x] 3b Mobile app shell: bottom tab bar, manifest + icons, safe areas, touch defaults
- [x] 3b Fixed: nested links on /categories (hydration), invented hero stats, unreadable search field
- [x] 3b Security: SEC-13 dev seed passwords, SEC-14 account list on login page
- [x] Dark theme visual QA of public routes (light + dark, 1440 + 390)
- [x] 3c Authenticated admin review (Super Admin + site admin, 1440/390, light/dark)
- [x] 3c UX-17 fabricated dashboard metrics → real data; UX-18 fake upsell removed
- [x] 3c UX-19 permission-aware sidebar, `/settings` guarded; UX-20 admin phone layout
- [x] 3d Keyboard-only QA: skip links, focus rings, aria-expanded, Escape closes drawer (E2E)
- [x] 3d `@axe-core/playwright` scan: ~80 → 0 serious/critical findings; central AA-safe ramps with guard tests (needs a new dev dependency)
- [x] 3d `/posts` decomposed (952 → 65 lines; hook + 9 components); real author, honest stats, correct live links
- [ ] Decompose `sites/[siteId]`, `users/[userId]`, `sites` pages (moved to Phase 4 backlog)

## Phase 4 checklist

- [x] TD-10 repository formatted (142 files, format-only); `format:check` passes
- [x] CI: `verify` job gets PostgreSQL (API suite needed it; CI test step could not pass before) + DB integration tests
- [x] CI: `e2e` job against production builds; throwaway accounts with masked random passwords; reproduced locally (`E2E_SERVER_MODE=production`)
- [x] Two-worker scheduled publishing test (SKIP LOCKED): no double publish, no duplicate outbox event
- [x] TD-12 `GET /posts/stats` server-side counts; status filter uses the same SQL rule (fixed short pages from client re-filtering)
- [x] TD-14 phone card list for posts; unique ids for menus/gradients (table + card render together)
- [x] DB-4 retention job (analytics, audit, sessions, outbox) with advisory lock; env windows
- [x] DB-6 found: analytics migration fabricated page views (100% of dev data); insert removed; `db:cleanup:generated-analytics` (dry run default)
- [ ] DB-6 run cleanup with `--apply` on existing databases (**owner decision**)
- [x] Restore drill (local pg_dump → pg_restore), timings recorded; stale “verified” claims corrected
- [x] TD-9 SSE scaling decision: ADR-0028 (one API instance)
- [x] `pnpm audit` reviewed: 0 high/critical
- [x] TD-8 empty folders removed
- [ ] First green GitHub Actions run (needs a push)
- [ ] API tests for newsletter, users/roles, settings (carried over)
- [ ] Decompose `sites/[siteId]`, `users/[userId]`, `sites` pages (carried over)
- [ ] TD-15 post actions menu can sit behind the phone tab bar

## Phase 6 checklist

- [x] Newsletter API tests (7): site-named message (Air Sports showed "travel newsletter"), atomic upsert, no email in audit log, throttle (DB-7)
- [x] Users/roles API tests (8): validation, role scoping, session revocation, last-Super-Admin invariant (SEC-15 race fixed, lock test proven by mutation), revoke from inactive Super Admin (false refusal fixed); N+1 removed
- [x] Platform settings API tests (12): Super Admin only, partial update keeps fields, nested validation (SEC-16)
- [x] SVG sandbox CSP (SEC-17)
- [x] TD-13 `/posts`: AlertDialog + notice; TD-15 Radix menu above the tab bar (E2E)
- [x] SEC-18 → Phase 7
- [ ] TD-5 decompose `sites/[siteId]`, `users/[userId]`, `sites` pages
- [ ] TD-13 remaining 24 native dialogs
- [ ] DB-5 personal-data erasure procedure
- [x] DB-6 cleanup applied on the dev DB (owner approved; 4,468 rows; table backup in the container)

## Phase 7 checklist (owner approved 2026-11-05)

- [x] `SettingsService.getPolicy()`: cached, clamped to safe bounds, safe defaults on failure (unit tests)
- [x] Login lockout from settings; atomic failed-attempt counter (SEC-21)
- [x] Session TTL from settings, applied to existing sessions; cookie max-age follows the session
- [x] Password min length / strength on user create and update
- [x] Upload size and types from settings (types narrowed to the code allowlist); multer 100 MB hard limit (SEC-19)
- [x] Default post status, preview lifetime, revision history (publication-referenced revisions kept)
- [x] Autosave interval in the editor via `GET /settings/policy` (`AutosaveScheduler`, tested)
- [x] Maintenance banner on both sites (shared `MaintenanceBanner`), verified in a browser (~24 s ISR delay)
- [x] Audit retention from settings (min 365); `AUDIT_RETENTION_DAYS` env removed
- [x] MFA, public registration, S3, WebP removed from settings (never implemented)
- [x] Settings audit IP from `req.ip` (SEC-20)

## Phase 8 checklist

- [x] Shared admin feedback: `ConfirmDialog`, `ActionNotice`, `apiErrorMessage`, generic `Pagination`
- [x] `/sites/[siteId]` 710 → 105 lines; accessible DNS dialog; live link only for verified primary domain
- [x] `/sites` 668 → 118 lines; real per-site counts (UX-28)
- [x] `/users`, `/users/[userId]` split; server-side search/filters; `GET /users/stats` (UX-26); real roles (UX-27)
- [x] Native dialogs replaced on media, taxonomy, comments, users, sites (TD-13); media double confirm fixed (UX-29)
- [x] Tag/category in use → 409 (DB-8); site timezone validated as IANA
- [x] Posts table uses `currentData` (UX-30)
- [ ] Phase 9: deployment readiness

## Phase 9 checklist

- [x] Production env files (git-ignored): API (Neon verify-full, Cloudinary, generated secrets), admin, both sites
- [x] Neon and Cloudinary reachable (read-only checks); API production env validates
- [x] Same-origin admin API proxy (SEC-22), verified locally on a production build
- [x] `bootstrap:platform` (roles + permissions, idempotent; integration test)
- [x] Site API fetches time out at 10 s (Vercel build no longer hangs; verified with an unreachable API)
- [x] Self-service password change (API + UI; other sessions revoked; tests)
- [x] User phone (migration `1793491212000`, E.164 check; API + profile UI; tests)
- [x] Contact phone on /contact; invented "Field Desks" text removed
- [x] Keep-alive workflow (backup) and `docs/deployment/production-runbook.md`
- [ ] Owner: Render env (`API_BASE_URL`, `CORS_ORIGINS`, `SITE_REVALIDATE_URLS`) and new start command
- [ ] Owner: admin Vercel URL → admin env + CORS
- [ ] Owner: first Super Admin via bootstrap CLI (password ≥ 12, upper/lower/digit)
- [ ] After deploy: cookies over HTTPS, client IP (TD-16), revalidation webhook, Cloudinary upload, UptimeRobot
