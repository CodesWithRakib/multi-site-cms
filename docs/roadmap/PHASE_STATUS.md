# Phase Status

Last updated: 2026-11-04

| Phase                              | Status                                  | Evidence / blocker                                                                                                                  |
| ---------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Audit                          | Done                                    | `docs/audit/*`                                                                                                                      |
| 1 — Secrets and security hardening | **Done in code; one owner action open** | Open: rotate Cloudinary secret (SEC-0)                                                                                              |
| 2 — Core workflow correctness      | **Done** (one coverage item deferred)   | API 263/263, integration 56/56. Deferred to Phase 4: API tests for newsletter, users/roles, settings                                |
| 3 — UX resilience                  | **In progress (3a done)**               | Boundaries, overflow, admin build fixed; E2E 27/27 locally. Remaining: dark theme + keyboard QA, axe scan, admin page decomposition |
| 4 — Production operations          | Not started                             |                                                                                                                                     |
| 5 — Commerce                       | **Out of scope**                        | Business decision 2026-11-04                                                                                                        |

All changes are uncommitted.

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
- [ ] Dark theme and keyboard-only QA of critical flows
- [ ] `@axe-core/playwright` on critical routes (needs a new dev dependency)
- [ ] Admin page decomposition, starting with `posts/page.tsx` (901 lines)
