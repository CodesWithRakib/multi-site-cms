# Phase 01 scope and acceptance

Status: **complete foundation**, pending stakeholder approval to begin Phase 02.
Date: 2026-11-01.

## Goal

Create a production-oriented foundation for a centralized multi-site publishing
platform without implementing publishing features. Phase 01 must make the
physical architecture, quality gates, security baseline, and decision record
clear enough that Phase 02 can add the content domain without re-litigating
structure.

## In scope

### Applications

- `apps/admin` — Next.js administration shell with a server-rendered page, a
  client status widget, and a per-request Redux store.
- `apps/api` — NestJS API with versioned prefix, health endpoint, request IDs,
  response envelopes, validation, CORS, Helmet, and rate limiting.
- `apps/sites/travel-blog` — independent Next.js public publication shell.
- `apps/sites/air-sports` — second independent publication with different
  branding and information density.

### Shared packages

- `types` — framework-free API contract types.
- `validation` — shared Zod schemas for public environment and web contracts.
- `config` — platform constants, validated public config, security headers.
- `api-client` — framework-free JSON transport with timeout and error
  normalization.
- `redux` — per-application store factory, RTK Query base API, typed hooks.
- `ui` — shadcn/ui-style primitives and the shared token contract.
- `tsconfig`, `eslint-config` — shared strict tooling.

### Platform engineering

- pnpm workspaces and Turborepo task graph.
- Strict TypeScript, ESLint, Prettier, Vitest, Jest, Playwright.
- PostgreSQL 18 Docker Compose service with extensions and health check.
- TypeORM CLI data source prepared for migrations only.
- GitHub Actions verification workflow.
- Environment examples, doctor script, documentation, ADRs, and project-local
  agent skills.

## Explicit non-goals

Phase 01 does **not** include:

- Authentication, sessions, password reset, MFA, or user management.
- Database entities or migrations beyond the extension bootstrap.
- Posts, revisions, publications, categories, tags, media uploads, or comments.
- Tiptap editor integration or rendered rich-text sanitization.
- Publishing, scheduling, webhooks, email, or background jobs.
- Site creation UI, domain verification, or automatic onboarding.
- Public content APIs or search.
- Analytics, billing, consent management, or localization workflows.
- Phase 02 implementation work of any kind.

The ERD, RBAC matrix, and threat model are design artifacts, not implemented
features.

## Acceptance criteria

| Area            | Criterion                                                                 | Evidence                                  |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| Workspace       | All applications and packages install from one lockfile                   | `pnpm install --frozen-lockfile`          |
| Types           | Strict type-check passes for every workspace and root E2E config          | `pnpm typecheck`                          |
| Lint            | No ESLint errors                                                          | `pnpm lint`                               |
| Formatting      | Repository matches Prettier configuration                                 | `pnpm format:check`                       |
| Unit/contract   | Shared packages and API contract tests pass                               | `pnpm test`                               |
| Build           | All four applications produce production builds                           | `pnpm build`                              |
| Browser smoke   | Admin, both sites, and API health work in Chromium                        | `pnpm test:e2e`                           |
| Local database  | Compose configuration validates and Postgres 18.6 starts                  | `docker compose ... config`, `pnpm db:up` |
| Security        | Baseline headers, CORS, rate limit, request IDs, and env validation exist | See threat model and tests                |
| Documentation   | Architecture, content model, ERD, RBAC, threat model, and ADRs exist      | `docs/`                                   |
| Agent readiness | Root instructions and eleven project-local skills exist                   | `AGENTS.md`, `.agent/skills/`             |
| Deployment      | Free-tier limits and production caveats are documented                    | `docs/deployment/free-tier-deployment.md` |

## Quality commands

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e:list
pnpm test:e2e
pnpm run doctor
```

## Phase 02 entry gate

Phase 02 may begin only after explicit approval of:

1. The canonical-content/publication model and ERD.
2. The RBAC scope model and first migration plan.
3. The authentication and session approach.
4. The media storage provider and upload constraints.
5. The production deployment target and paid-tier acceptance.

Phase 01 must not be extended with “small” feature work while waiting for
approval.
