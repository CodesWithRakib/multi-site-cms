# Next Session

## State at handoff (2026-11-05, Phase 8)

- Phases 1–7 committed. Phase 8 (admin decomposition, UX correctness) done and **uncommitted**; the user commits and pushes to GitHub.
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

## Exact next action — Phase 9 (deployment readiness)

Targets: Neon PostgreSQL, Render (API, free), Vercel (admin + two sites, free).
Plan: `docs/roadmap/MASTER_IMPLEMENTATION_PLAN.md` Phase 9. In order:

1. Same-origin API proxy (Next.js rewrites) for admin and sites (SEC-22).
2. Production-safe platform bootstrap CLI (roles, permissions).
3. `render.yaml`, Vercel settings, `docs/deployment/production-runbook.md`.
4. Keep-alive + uptime monitor; post-deploy smoke script.
5. After the first deploy: verify forwarded client IP and set TRUST_PROXY (TD-16),
   cookies over HTTPS, Neon TLS, ISR revalidation webhook.

Owner provides URLs (not secrets) after creating the services; secrets go
straight into the Render/Vercel dashboards.

Role, admin, accessibility and keyboard E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).
