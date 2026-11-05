# Phase Status

Last updated: 2026-11-05 (Phase 6)

| Phase                              | Status                                  | Evidence / blocker                                                                                                                                                             |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0 — Audit                          | Done                                    | `docs/audit/*`                                                                                                                                                                 |
| 1 — Secrets and security hardening | **Done in code; one owner action open** | Open: rotate Cloudinary secret (SEC-0)                                                                                                                                         |
| 2 — Core workflow correctness      | **Done** (one coverage item deferred)   | API 263/263, integration 56/56. Deferred to Phase 4: API tests for newsletter, users/roles, settings                                                                           |
| 3 — UX resilience                  | **Done (3a–3d)**                        | WCAG 2.2 AA: 0 serious/critical (axe, light+dark, public+admin); keyboard flows tested; `/posts` decomposed. E2E 51/51. Remaining page decompositions moved to Phase 4 backlog |
| 4 — Production operations          | **Done in code; owner/CI checks open**  | API 267/267, integration 67/67, E2E full suite green on production builds locally. Open: first GitHub CI run, DB-6 cleanup decision, provider PITR drill                       |
| 5 — Commerce                       | **Out of scope**                        | Business decision 2026-11-04                                                                                                                                                   |
| 6 — Coverage and hardening backlog | **In progress**                         | API 294/294, integration 67/67, E2E posts/keyboard/axe 12/12. Open: SEC-18 decision, TD-5 decompositions, TD-13 other screens                                                  |

Phases 1–3 are committed by the owner; Phase 4 committed; Phase 6 changes are uncommitted.

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
- [ ] SEC-18 platform settings enforced nowhere (**owner decision**)
- [ ] TD-5 decompose `sites/[siteId]`, `users/[userId]`, `sites` pages
- [ ] TD-13 remaining 24 native dialogs
- [ ] DB-5 personal-data erasure procedure
- [ ] DB-6 cleanup `--apply` (**owner decision**, carried from Phase 4)
