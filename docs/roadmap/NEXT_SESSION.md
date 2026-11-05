# Next Session

## State at handoff (2026-11-05)

- Phases 1–4 done in code. Phase 4 changes are **uncommitted**; the user commits.
- Owner actions: rotate the Cloudinary secret (SEC-0) and any passwords set by
  the old admin seed (SEC-13); set `NEXT_PUBLIC_CONTACT_EMAIL`,
  `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`. Deploy one API instance (ADR-0028).
- **Decision pending (DB-6):** remove generated analytics from existing
  databases with `pnpm --filter @multi-site-cms/api db:cleanup:generated-analytics`
  (dry run), then `--apply` after a backup. Dev DB: 4,468 of 4,468 page views
  are generated.
- Dev database: `POSTGRES_PORT=5433 pnpm db:up`; all migrations applied.
- Colors: edit `packages/ui/src/theme/site-themes.ts` only (ADR-0027).

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`; `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`;
   `pnpm --filter @multi-site-cms/api test:integration`;
   `npx playwright test` (or `pnpm build` then `E2E_SERVER_MODE=production`).
   Do not edit API files while E2E runs against the watch-mode API.

## Exact next action

1. After the owner pushes: check the first GitHub Actions run of `verify` and
   `e2e`; fix anything environment-specific.
2. API tests for newsletter, users/roles, settings (carried over from Phase 2).
3. Decompose `sites/[siteId]`, `users/[userId]`, `sites` admin pages (TD-5).
4. TD-15 (actions menu vs phone tab bar), TD-13 (native confirm/alert).
5. Erasure procedure for personal data (DB-5) when legally required.

Role, admin, accessibility and keyboard E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).
