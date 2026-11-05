# Next Session

## State at handoff (2026-11-05, Phase 6)

- Phases 1–4 done and committed. Phase 6 (coverage and hardening) in progress; its changes are **uncommitted**; the user commits.
- Owner actions: rotate the Cloudinary secret (SEC-0) and any passwords set by
  the old admin seed (SEC-13); set `NEXT_PUBLIC_CONTACT_EMAIL`,
  `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`. Deploy one API instance (ADR-0028).
- **Decision pending (DB-6):** remove generated analytics from existing
  databases with `pnpm --filter @multi-site-cms/api db:cleanup:generated-analytics`
  (dry run), then `--apply` after a backup. Dev DB: 4,468 of 4,468 page views
  are generated.
- **Decision pending (SEC-18):** platform settings are stored but enforced nowhere. Option A: wire lockout/session/password/upload settings into auth and media (changes authentication behavior; needs approval). Option B (recommended first): make the settings page read-only with the real values and remove controls for features that do not exist (MFA, S3).
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

1. Apply the owner's SEC-18 decision.
2. Decompose `sites/[siteId]`, `users/[userId]`, `sites` admin pages (TD-5), replacing
   their native dialogs on the way (TD-13; 24 calls remain).
3. Check the first GitHub Actions run of `verify` and `e2e` after a push.
4. DB-5 personal-data erasure procedure when legally required.

Role, admin, accessibility and keyboard E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).
