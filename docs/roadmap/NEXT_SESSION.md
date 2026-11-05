# Next Session

## State at handoff (2026-11-05, Phase 7)

- Phases 1–4 committed. Phases 6 and 7 done; their changes are **uncommitted**; the user commits.
- Owner actions: rotate the Cloudinary secret (SEC-0) and any passwords set by
  the old admin seed (SEC-13); set `NEXT_PUBLIC_CONTACT_EMAIL`,
  `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`. Deploy one API instance (ADR-0028).
- DB-6: generated analytics deleted from the dev DB (approved). Other existing databases: run `db:cleanup:generated-analytics` (dry run, backup, `--apply`).
- Platform settings are enforced (Phase 7); see `docs/backend/configuration.md`. Changing them in the dev admin changes real behavior (lockout, uploads, sessions).
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

1. Decompose `sites/[siteId]`, `users/[userId]`, `sites` admin pages (TD-5), replacing
   their native dialogs on the way (TD-13; 24 calls remain).
2. Check the first GitHub Actions run of `verify` and `e2e` after a push.
3. Optional: revalidate the `platform-settings` tag on save so the maintenance
   banner appears immediately instead of within ~30–60 s.
4. DB-5 personal-data erasure procedure when legally required.

Role, admin, accessibility and keyboard E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).
