# Next Session

## State at handoff (2026-11-04)

- Phases 1–3 done (3a–3d). Phase 3d changes are **uncommitted**; the user commits.
- Owner actions: rotate the Cloudinary secret (SEC-0) and any passwords set by
  the old admin seed (SEC-13); set `NEXT_PUBLIC_CONTACT_EMAIL`,
  `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`.
- Dev database: start with `POSTGRES_PORT=5433 pnpm db:up` (matches `apps/api/.env`); all migrations applied.
- Colors: edit `packages/ui/src/theme/site-themes.ts` only (ADR-0027).

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`; `pnpm lint && pnpm typecheck && pnpm test`;
   `pnpm --filter @multi-site-cms/api test:integration`; `npx playwright test`.

## Exact next action — Phase 4 (production operations)

1. CI: run Playwright against production builds (replace `test:e2e:list`), with
   PostgreSQL service, seeded data, and the axe and keyboard specs. Admin specs
   need CI secrets for test accounts.
2. Formatting-only commit for the 145 pre-existing unformatted files (TD-10) so
   `format:check` passes in CI.
3. Scheduled-worker concurrency test (two workers, SKIP LOCKED).
4. Server-side post counts for the posts workspace (TD-12); card list on phones (TD-14).
5. Retention jobs (analytics, audit), restore drill, SSE scaling decision.

Role, admin, accessibility and keyboard E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).

Then (CI E2E against production builds, formatting commit TD-10,
worker concurrency test, SSE scaling, retention, restore drill).
