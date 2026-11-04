# Phase Status

Last updated: 2026-11-04

| Phase                              | Status                                  | Evidence / blocker                                                                                       |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0 — Audit                          | Done                                    | `docs/audit/*`                                                                                           |
| 1 — Secrets and security hardening | **Done in code; one owner action open** | Open: rotate Cloudinary secret (SEC-0)                                                                   |
| 2 — Core workflow correctness      | **In progress (2a done)**               | Remaining: SEC-8 sweep, TD-4, TD-7, API tests for admin comments / newsletter / users / audit / settings |
| 3 — UX resilience                  | Partly started                          | Contact page done (`mailto:`); boundaries, browser QA pending                                            |
| 4 — Production operations          | Not started                             |                                                                                                          |
| 5 — Commerce                       | **Out of scope**                        | Business decision 2026-11-04                                                                             |

All changes are uncommitted.

## Phase 1 checklist

- [x] SEC-0 Cloudinary credentials removed from source; env validation added
- [ ] SEC-0 Secret rotated in Cloudinary (**owner**)
- [x] SEC-1, SEC-2, SEC-3, SEC-4, SEC-5, SEC-7, SEC-10
- [x] SEC-6 newsletter throttle
- [x] Stale OpenAPI test updated; docs corrected

## Phase 2 checklist

- [x] Revalidation wired: ADR-0026, `resolveSiteBaseUrl`, redirects refused, article paths fixed
- [x] SEC-9 comment pre-moderation (API, UI message, migration default)
- [x] SEC-6 comment rate limit in the travel-blog proxy
- [x] DB-1 composite FK `(publication_id, site_id)`; migration round-trip test
- [x] Stale integration-test counts fixed (6→12 migrations, 19→24 entities)
- [ ] SEC-8 object-level authorization sweep (posts, publications, media)
- [ ] TD-4 shared site-ID resolver for guards
- [ ] TD-7 `API_BASE_URL` in the validated env schema
- [ ] API tests: admin comments, newsletter, users/roles, audit-logs, settings

## Phase 3 (started early by decision)

- [x] FEAT-TB-9 contact page: `mailto:`, server component with metadata
