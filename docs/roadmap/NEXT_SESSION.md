# Next Session

## State at handoff (2026-11-04)

- Phases 1–2 done; Phase 3a–3c done. Phase 3c changes are **uncommitted** (earlier work was committed by the user).
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

## Exact next action — Phase 3d

1. Keyboard-only pass: admin login → posts → editor → publish modal; travel
   home → article → comment form; air-sports home → event. Record findings.
2. `@axe-core/playwright` scan of those routes (new dev dependency — confirm first).
3. Admin decomposition, one route per change, starting with `apps/admin/src/app/posts/page.tsx`,
   moving palette classes to semantic tokens (TD-11).

Role and admin E2E need local accounts:
`E2E_ADMIN_EMAIL/PASSWORD`, `E2E_SITE_ADMIN_EMAIL/PASSWORD` (never commit them).

Then Phase 4 (CI E2E against production builds, formatting commit TD-10,
worker concurrency test, SSE scaling, retention, restore drill).
