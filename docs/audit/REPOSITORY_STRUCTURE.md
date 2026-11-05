# Repository Structure

The canonical map and ownership rules are in [AGENTS.md](../../AGENTS.md) and
[monorepo-structure.md](../architecture/monorepo-structure.md). This file only
records what the audit verified on disk and where reality differs.

## Workspaces (pnpm-workspace.yaml: `apps/*`, `apps/sites/*`, `packages/*`)

| Workspace                                     | Verified contents                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/api`                                    | 14 Nest modules: analytics, auth, comments, common/audit, dashboard, database, health, media, posts, publishing, settings, sites, taxonomy, users |
| `apps/admin`                                  | 20 routes under `src/app`; feature folders in `src/features/*` (no `features/sites` — site screens live in `src/app/sites/*` pages)               |
| `apps/sites/travel-blog`                      | 18 route files incl. 3 route handlers (`api/revalidate`, `api/search`, `api/articles/[slug]/comments`)                                            |
| `apps/sites/air-sports`                       | 15 route files incl. 2 route handlers (`api/revalidate`, `api/search`)                                                                            |
| `packages/types`                              | Contract types                                                                                                                                    |
| `packages/validation`                         | Zod schemas                                                                                                                                       |
| `packages/config`                             | Constants, public env, security headers; **new** `./revalidation` (server-only)                                                                   |
| `packages/api-client`                         | Fetch transport                                                                                                                                   |
| `packages/redux`                              | Store factory, base query                                                                                                                         |
| `packages/ui`                                 | UI primitives                                                                                                                                     |
| `packages/tsconfig`, `packages/eslint-config` | Tooling                                                                                                                                           |

## Other top-level paths

- `e2e/platform.spec.ts` — 16 Playwright tests (scenarios A–F).
- `infrastructure/docker` — PostgreSQL 18 compose file (host port 5433 in the
  running container). The empty `infrastructure/database/init` and
  `infrastructure/deployment` directories were removed in Phase 4 (TD-8).
- `docs/api`, `docs/decisions`, `docs/screenshots`, `docs/testing` — were empty; removed in Phase 4 (TD-8).
- `.agent/skills/*` — 16 project skills indexed in AGENTS.md.
- `.github/workflows/ci.yml` — single CI workflow.

## Deviations from documented structure

- `apps/admin` page files are large orchestration components (e.g.
  `src/app/sites/page.tsx`, `src/app/posts/page.tsx`); see
  [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md).
- Empty documentation and infrastructure folders suggest planned but missing
  content; they should be removed or filled.
