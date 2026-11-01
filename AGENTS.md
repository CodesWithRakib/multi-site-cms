# AGENTS.md — canonical engineering instructions

This is the single source of truth for human contributors and AI agents. Agent
specific files (`CLAUDE.md`, `.opencode/`, `.github/copilot-instructions.md`)
contain pointers only; they must not restate or contradict these rules.

## Read before you code

1. This file.
2. The applicable skill in [.agent/skills/](.agent/skills/) — the index below.
3. The design document for the area you touch, from
   [docs/architecture/](docs/architecture/) or [docs/README.md](docs/README.md).
4. The existing implementation. Never design in isolation from the code.

## Non-negotiables

- **Phase 01 is a foundation.** Do not add authentication, posts, revisions,
  publications, media uploads, the editor, scheduling, or public content APIs.
  The ERD, RBAC matrix, and threat model are design artifacts.
- **Strict TypeScript.** No `any`, no non-null assertions to silence the
  compiler, no `@ts-ignore`. Fix the type or model the state.
- **Dependency direction.** Applications may import packages; packages never
  import applications or another package's internals (`@multi-site-cms/*/src/*`).
- **One API contract.** All HTTP goes through `@multi-site-cms/api-client` and the
  shared envelope types in `@multi-site-cms/types`. Do not add a second fetch
  layer, a second Redux store pattern, or a second validation library.
- **Backend authorization only.** UI hiding is not security. Every site-scoped
  read and write must constrain by `site_id` server-side and re-check the
  caller's membership. A caller-supplied site ID is never authorization.
- **Migrations only.** `synchronize` stays `false` in every environment. Schema
  changes are reviewed TypeORM migrations.
- **No secrets in the repository.** Only `.env.example` files are committed.
  Anything that reaches a `NEXT_PUBLIC_*` variable is public forever.
- **Documentation ships with the change.** A changed boundary, command,
  dependency, or security control requires a doc update in the same change.

## Repository map

| Path                                          | Responsibility                                                |
| --------------------------------------------- | ------------------------------------------------------------- |
| `apps/admin`                                  | Admin shell; the only application with Redux/RTK Query        |
| `apps/api`                                    | NestJS modular monolith; `/api/v1`, envelopes, guards         |
| `apps/sites/travel-blog`                      | Public publication, independent branding and deploy           |
| `apps/sites/air-sports`                       | Public publication, independent branding and deploy           |
| `packages/types`                              | Contract types, zero runtime dependencies                     |
| `packages/validation`                         | Zod schemas shared by web and API                             |
| `packages/config`                             | Constants, validated public env, security headers             |
| `packages/api-client`                         | Framework-free transport with timeout and error normalization |
| `packages/redux`                              | Store factory, base query, typed hooks                        |
| `packages/ui`                                 | Presentation primitives and CSS token contract                |
| `packages/tsconfig`, `packages/eslint-config` | Shared tooling configuration                                  |
| `infrastructure/docker`                       | Local PostgreSQL 18                                           |
| `docs`                                        | Design, security, deployment, and decision records            |

Per-application `AGENTS.md` files contain a generated Next.js version notice.
`next dev` rewrites that block; commit it as generated and do not edit it.

## Commands

```bash
pnpm install            pnpm dev              pnpm build
pnpm lint               pnpm typecheck        pnpm test
pnpm format             pnpm format:check     pnpm test:e2e
pnpm run doctor         pnpm db:up            pnpm db:down
```

Scope work with `pnpm --filter <package> <script>`; run the affected checks, not
only a root aggregate, when debugging a single workspace.

## Workflow for any non-trivial change

1. Read this file and the relevant skills.
2. Read the relevant architecture document.
3. Inspect the current implementation of the affected area.
4. Name the affected applications, modules, packages, and entities.
5. Search for existing reusable functionality before writing new code.
6. Plan the change and identify security, performance, and migration impact.
7. Implement incrementally, in the smallest correct steps.
8. Add tests at the level that can actually fail: pure logic in Vitest, API
   behavior in Jest with `supertest`, cross-application behavior in Playwright.
9. Update the affected documentation.
10. Run `pnpm lint`, `pnpm typecheck`, and the relevant tests.
11. Report changed files, decisions, verification performed, and unresolved
    risks — including checks that could not run.

## When a request conflicts with the architecture

Do not silently diverge. Explain the conflict, evaluate alternatives, propose an
ADR update in `docs/adr/`, and obtain approval before changing a foundational
decision. Examples of foundational decisions: monorepo tooling, one API, the
canonical-content/publication model, the state-management split, the free-first
hosting posture.

Never introduce a second state manager, a duplicate API layer, an alternate
database access pattern, or a competing UI system to finish a feature faster.

## Skills index

| Skill                     | Load it when you touch                                   |
| ------------------------- | -------------------------------------------------------- |
| `architecture-governance` | Boundaries, packages, ADRs, cross-cutting design         |
| `clean-code`              | Any source change; naming, structure, errors             |
| `database-engineering`    | Entities, migrations, constraints, indexes, transactions |
| `api-engineering`         | Controllers, DTOs, guards, envelopes, versioning         |
| `frontend-engineering`    | Pages, layouts, Server/Client components, accessibility  |
| `state-management`        | Redux, RTK Query, forms, editor state                    |
| `security-engineering`    | Auth, RBAC, validation, headers, secrets, audit          |
| `testing-quality`         | Test design, coverage, fixtures, E2E                     |
| `performance-engineering` | Queries, bundles, caching, rendering, Core Web Vitals    |
| `documentation`           | Docs, ADRs, README, runbooks, diagrams                   |
| `deployment-engineering`  | Environments, CI, hosting, database operations           |

Each skill follows the same shape: purpose, when to use it, mandatory rules,
workflow, anti-patterns, review checklist, project references.

## Definition of done

- The change works and is the smallest correct change.
- `pnpm lint`, `pnpm typecheck`, and the relevant tests pass, or the failure is
  reported with its output.
- No new dependency without a documented reason and a compatibility check.
- No unrelated refactor, no speculative abstraction, no placeholder feature.
- Documentation and, when a decision changed, an ADR are updated.
