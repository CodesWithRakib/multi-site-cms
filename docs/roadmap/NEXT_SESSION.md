# Next Session

## State at handoff (2026-11-04)

- Phases 1 and 2 done (one Phase 2 coverage item moved to Phase 4). All changes **uncommitted**.
- Owner actions: rotate the Cloudinary secret; set `NEXT_PUBLIC_CONTACT_EMAIL`;
  set `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally); in production also
  `PREVIEW_TOKEN_SECRET` and `API_BASE_URL`.
- Migration `1793491211000` is not applied to the dev database yet:
  `pnpm --filter @multi-site-cms/api build && pnpm --filter @multi-site-cms/api db:migration:run`.
- All business decisions made (see `docs/audit/PRODUCTION_READINESS.md`).

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`, then `pnpm lint && pnpm typecheck && pnpm test` and
   `pnpm --filter @multi-site-cms/api test:integration`.

## Exact next action — Phase 3, UX-1

Add route boundaries to the three Next.js apps, following each app's existing
layout, tokens, and `.agent/skills/ui-ux-design-standards`:

- `src/app/not-found.tsx` (branded 404 with navigation back)
- `src/app/error.tsx` (client component, `reset()` retry, no error details shown)
- `src/app/global-error.tsx` (minimal, own `<html>`/`<body>`)
- `loading.tsx` only for routes with slow server data (article detail, event detail)

Then verify in a browser at 1440 / 768 / 375 in both themes, starting the apps
with `pnpm dev` (API on :4000 needs PostgreSQL via `pnpm db:up`).
