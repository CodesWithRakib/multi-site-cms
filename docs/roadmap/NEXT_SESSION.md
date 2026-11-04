# Next Session

## State at handoff (2026-11-04)

- Phases 1–2 done; Phase 3a and 3b done. All changes **uncommitted**.
- Owner actions: rotate the Cloudinary secret (SEC-0) and any passwords set by
  the old admin seed (SEC-13); set `NEXT_PUBLIC_CONTACT_EMAIL`,
  `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`.
- Migration `1793491211000` not yet applied to the dev database:
  `pnpm --filter @multi-site-cms/api build && pnpm --filter @multi-site-cms/api db:migration:run`.
- Colors: edit `packages/ui/src/theme/site-themes.ts` only (ADR-0027).

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`; `pnpm lint && pnpm typecheck && pnpm test`;
   `pnpm --filter @multi-site-cms/api test:integration`; `npx playwright test`.

## Exact next action — Phase 3c

1. Authenticated admin visual review. Needs a local admin login, provided by
   the user as `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`, then:
   `VISUAL_TOUR=1 VISUAL_OUT=<dir> npx playwright test e2e/visual-tour.spec.ts`.
   Check the admin shell on phones (sidebar vs bottom navigation).
2. Keyboard-only pass of critical flows; `@axe-core/playwright` scan (new dev
   dependency — confirm with the user first).
3. Admin decomposition, one route per change, starting with `posts/page.tsx`,
   moving palette classes to semantic tokens as each route is touched (TD-11).

Then Phase 4 (CI E2E against production builds, formatting commit TD-10,
worker concurrency test, SSE scaling, retention, restore drill).
