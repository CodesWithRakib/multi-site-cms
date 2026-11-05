# Production Readiness (evidence-based, updated 2026-11-05 after Phase 4)

## Verdict: **Not production-ready** (owner actions and a deployed environment remain)

Score: **8.5 / 10** for the publishing CMS (5 at the initial audit, 8 after Phase 3).
Booking, payments, and customer accounts are out of scope by business
decision (2026-11-04) and are not scored.

| Dimension      | Score | Evidence                                                                                                                                                                      |
| -------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security       | 6.5   | Secret, preview, CSRF, webhook fixes regression-tested; comment pre-moderation; `pnpm audit`: 0 high/critical, 3 tooling-only moderate/low. Cloudinary rotation still pending |
| Correctness    | 7.5   | API 267/267, integration 67/67; server-side post counts with one status rule shared by list and counts; scheduled publishing proven safe with two concurrent workers          |
| Test evidence  | 8     | Full Playwright suite passes against production builds locally (`E2E_SERVER_MODE=production`); CI now runs DB integration tests and E2E (first CI run not yet observed)       |
| UX resilience  | 8.5   | WCAG 2.2 AA: 0 serious/critical axe findings; keyboard flows tested; posts card list on phones                                                                                |
| Operations     | 6.5   | Restore drill performed and recorded (local); retention job; single-instance limit decided (ADR-0028). Monitoring/alerting and provider PITR not verified                     |
| Data / privacy | 6     | Retention windows enforced (DB-4); generated analytics found and removable (DB-6); no erasure procedure yet (DB-5)                                                            |

## Release blockers

1. Rotate the Cloudinary API secret (SEC-0), and any account passwords set by the old admin seed script on a shared database (SEC-13). Owner action.
2. Set `PREVIEW_TOKEN_SECRET` (≥32 chars) and `API_BASE_URL` (public, non-localhost) in production; the API refuses to
   boot without it. Breaking change for existing deploy configs.
3. Set `REVALIDATE_SECRET` (same value) on the API and both sites, and verify
   each site's primary domain (or set `SITE_REVALIDATE_URLS`), or publishes
   only appear after the 60 s ISR window.
4. Run pending migrations (`pnpm --filter @multi-site-cms/api db:migration:run` after build).
5. Set `NEXT_PUBLIC_CONTACT_EMAIL` on the travel blog, or `/contact` shows no address.
6. On any database that already ran migration `1793491207000`, remove the
   generated page views (DB-6): `db:cleanup:generated-analytics` dry run, backup,
   then `--apply`. Until then the analytics dashboard shows fabricated traffic.
7. Observe the first green CI run of the new `verify` (PostgreSQL) and `e2e` jobs.
8. Deploy exactly one API instance (ADR-0028).

## Business decisions

| Decision                  | Outcome (2026-11-04)                                           |
| ------------------------- | -------------------------------------------------------------- |
| Booking/commerce in scope | No — the platform stays a publishing CMS                       |
| Comment moderation        | Pre-moderation (`pending` until approved)                      |
| Contact form              | `mailto:` for now; an inquiry inbox can come later             |
| Revalidation target       | Override env, else verified primary domain (ADR-0026)          |
| Newsletter                | Collect only (decided); no opt-in, unsubscribe, or sending yet |
| Realtime scaling          | One API instance; `LISTEN/NOTIFY` before scaling (ADR-0028)    |

## Not verified (environment or scope limits)

- Production deployment, HTTPS, CDN, and DNS — no target environment available.
- Revalidation against a deployed site (tested against a local stub server).
- Restore from the hosting provider's snapshots / point-in-time recovery
  (the local `pg_dump` → `pg_restore` drill passed; see backup-and-recovery.md).
- The GitHub Actions workflow itself: its steps were reproduced locally, but it
  has not run on GitHub yet.
- Monitoring and alerting.
