# Phase Status

Last updated: 2026-11-04

| Phase                              | Status                                  | Evidence / blocker                                                                                                            |
| ---------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 0 — Audit                          | Done                                    | `docs/audit/*`                                                                                                                |
| 1 — Secrets and security hardening | **Done in code; one owner action open** | Gate green (lint, typecheck, 221 API + all package/app tests). Open: rotate Cloudinary secret (SEC-0). Changes not committed. |
| 2 — Core workflow correctness      | Not started                             | Revalidation design needs an ADR; comment moderation needs a business decision                                                |
| 3 — UX resilience                  | Not started                             | Contact-form option needs a business decision                                                                                 |
| 4 — Production operations          | Not started                             |                                                                                                                               |
| 5 — Commerce                       | Not planned                             | Business decision: is booking/payments in scope?                                                                              |

## Phase 1 checklist

- [x] SEC-0 Cloudinary credentials removed from source; env validation added
- [ ] SEC-0 Secret rotated in Cloudinary (**owner**)
- [x] SEC-1 Preview key from validated env; production requires it
- [x] SEC-2 Object-level check on preview-token minting
- [x] SEC-3 Preview `siteId` bound to the signed token
- [x] SEC-4 Single fail-closed revalidation contract (API + both sites)
- [x] SEC-5 CSRF login exemption by exact path
- [x] SEC-6 Newsletter throttle (comments moved to Phase 2)
- [x] SEC-7 Constant-time signature comparison
- [x] SEC-10 Tests pinned to local storage
- [x] Stale OpenAPI test updated to the 77 implemented paths
- [x] Docs: env reference, cache-invalidation contract, superseded banners
