# Production Readiness (evidence-based, updated 2026-11-04 after Phase 2a)

## Verdict: **Not production-ready**

Score: **6 / 10** for the publishing CMS (up from 5 at the initial audit).
Booking, payments, and customer accounts are out of scope by business
decision (2026-11-04) and are not scored.

| Dimension      | Score | Evidence                                                                                                                                                 |
| -------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security       | 6     | Secret, preview, CSRF, and webhook issues fixed and regression-tested; comment pre-moderation and rate limit in place; Cloudinary rotation still pending |
| Correctness    | 7     | API 242/242, integration 56/56; revalidation wired (ADR-0026); contact page honest (`mailto:`). Not verified against a deployed site                     |
| Test evidence  | 5     | Strong API coverage; E2E never runs in CI; thin frontend tests                                                                                           |
| UX resilience  | 4     | No error / 404 / loading boundaries (UX-1); no browser verification yet                                                                                  |
| Operations     | 5     | Health / readiness exist; backup restore drill, monitoring, and alerting not verified                                                                    |
| Data / privacy | 5     | Migrations reviewed; latest one round-trip tested; no retention or erasure policy (DB-4, DB-5)                                                           |

## Release blockers

1. Rotate the Cloudinary API secret (SEC-0). Owner action.
2. Set `PREVIEW_TOKEN_SECRET` (≥32 chars) and `API_BASE_URL` (public, non-localhost) in production; the API refuses to
   boot without it. Breaking change for existing deploy configs.
3. Set `REVALIDATE_SECRET` (same value) on the API and both sites, and verify
   each site's primary domain (or set `SITE_REVALIDATE_URLS`), or publishes
   only appear after the 60 s ISR window.
4. Run migration `1793491211000-PreModeratedComments` (`pnpm --filter @multi-site-cms/api db:migration:run` after build).
5. Set `NEXT_PUBLIC_CONTACT_EMAIL` on the travel blog, or `/contact` shows no address.
6. Add branded `error.tsx` / `not-found.tsx` to all three apps (UX-1).
7. Run the Playwright suite in CI against a real stack.

## Business decisions

| Decision                  | Outcome (2026-11-04)                                           |
| ------------------------- | -------------------------------------------------------------- |
| Booking/commerce in scope | No — the platform stays a publishing CMS                       |
| Comment moderation        | Pre-moderation (`pending` until approved)                      |
| Contact form              | `mailto:` for now; an inquiry inbox can come later             |
| Revalidation target       | Override env, else verified primary domain (ADR-0026)          |
| Newsletter                | Collect only (decided); no opt-in, unsubscribe, or sending yet |

## Not verified (environment or scope limits)

- Production deployment, HTTPS, CDN, and DNS — no target environment available.
- Revalidation against a deployed site (tested against a local stub server).
- Backup and restore drill.
- `pnpm audit` dependency scan.
- Browser verification of any UI.
