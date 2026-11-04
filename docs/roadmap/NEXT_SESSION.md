# Next Session

## State at handoff (2026-11-04)

- Phases 1–2 done; Phase 3a done. All changes **uncommitted**.
- Owner actions: rotate the Cloudinary secret; set `NEXT_PUBLIC_CONTACT_EMAIL`;
  set `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`.
- Migration `1793491211000` is not applied to the dev database yet:
  `pnpm --filter @multi-site-cms/api build && pnpm --filter @multi-site-cms/api db:migration:run`.

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`, then `pnpm lint && pnpm typecheck && pnpm test`,
   `pnpm --filter @multi-site-cms/api test:integration`, and `npx playwright test`
   (starts all four servers; first run compiles for ~1 min).

## Exact next action — Phase 3b

1. Dark theme + keyboard-only pass over: admin login → posts list → editor →
   publishing modal; travel home → article → comment form; air-sports home → event.
   Use Playwright (`page.emulateMedia({ colorScheme: 'dark' })`, `keyboard.press('Tab')`).
2. Propose adding `@axe-core/playwright` (new dev dependency — needs a short
   justification in the change) and scan the routes above.
3. Admin decomposition, one route per change, starting with `apps/admin/src/app/posts/page.tsx`.

Then Phase 4: run Playwright in CI (replace `test:e2e:list`), worker concurrency
test, SSE scaling decision, retention jobs, restore drill, deferred API tests.
