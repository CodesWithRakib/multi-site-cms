# Next Session

## State at handoff (2026-11-04)

- Phase 1 done; Phase 2a done. All changes **uncommitted** (partly staged by the editor).
- Owner actions: rotate the Cloudinary secret; set `NEXT_PUBLIC_CONTACT_EMAIL`;
  set `REVALIDATE_SECRET` (+ `SITE_REVALIDATE_URLS` locally).
- Migration `1793491211000` is not applied to the dev database yet:
  `pnpm --filter @multi-site-cms/api build && pnpm --filter @multi-site-cms/api db:migration:run`.
- Open decision: newsletter scope (collect only vs opt-in + sending).

## Resume steps

1. Read `AGENTS.md`, `docs/roadmap/PHASE_STATUS.md`, this file.
2. `git status`.
3. `pnpm db:up`, then `pnpm lint && pnpm typecheck && pnpm test` and
   `pnpm --filter @multi-site-cms/api test:integration`.

## Exact next action — Phase 2b

SEC-8 sweep: list every method in `apps/api/src/posts/posts.service.ts`,
`publications.service.ts`, and `apps/api/src/media/media.service.ts` that takes
an id without `siteId` in the route, confirm each calls `canAccessPost` (or the
media equivalent), and add one cross-site denial test per method in
`test/api/rbac-and-site-isolation.e2e-spec.ts`.

Then: TD-4 (one site-ID resolver shared by `SiteAccessGuard` and
`PermissionsGuard`), TD-7 (`API_BASE_URL` in `config/env.ts`, required in
production), and API tests for admin comments, newsletter, users/roles,
audit-logs, settings.
