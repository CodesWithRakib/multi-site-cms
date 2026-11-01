# Multi-Site CMS

A centralized publishing platform that will manage two independent public
publications — a travel blog and an air sports live desk — through one admin
application, one NestJS API, and one PostgreSQL database.

**Status: Phase 01 (engineering foundation).** The repository contains the
monorepo, tooling, application shells, infrastructure, security baseline, design
documents, and agent instructions. It intentionally contains **no**
authentication, content, media, or publishing features. See
[docs/product/phase-01-scope.md](docs/product/phase-01-scope.md).

## Prerequisites

| Tool    | Version            | Notes                                         |
| ------- | ------------------ | --------------------------------------------- |
| Node.js | `>=24.11.0`        | `.nvmrc` pins 24                              |
| pnpm    | `>=12.4.2`         | `corepack enable && corepack use pnpm@12.4.2` |
| Docker  | any recent release | Only for the local PostgreSQL 18              |

## Quick start

```bash
pnpm install
pnpm run doctor        # environment diagnostics (not pnpm's built-in `doctor`)
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
pnpm db:up             # optional: PostgreSQL 18 on :5432
pnpm dev               # all four applications through Turborepo
```

| Application     | URL                   | Package                       |
| --------------- | --------------------- | ----------------------------- |
| Admin           | http://localhost:5000 | `@multi-site-cms/admin`       |
| Travel blog     | http://localhost:5001 | `@multi-site-cms/travel-blog` |
| Air sports live | http://localhost:5002 | `@multi-site-cms/air-sports`  |
| API (`/api/v1`) | http://localhost:4000 | `@multi-site-cms/api`         |

## Commands

| Command                                              | Purpose                                              |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                                           | Run every application in watch mode                  |
| `pnpm build`                                         | Production build for every workspace                 |
| `pnpm lint`                                          | ESLint across the repository                         |
| `pnpm typecheck`                                     | Strict TypeScript check for workspaces plus root E2E |     | `pnpm test` | Vitest (packages) and Jest (API) suites |
| `pnpm --filter @multi-site-cms/api test:integration` | PostgreSQL schema tests (needs a `_test` database)   |
| `pnpm --filter @multi-site-cms/api db:migration:run` | Apply migrations (build the API first)               |
| `pnpm --filter @multi-site-cms/api db:seed:dev`      | Idempotent development seed (no user accounts)       |
| `pnpm test:e2e`                                      | Playwright smoke suite against all four applications |
| `pnpm format`                                        | Prettier write; `pnpm format:check` for CI parity    |
| `pnpm db:up`/`db:down`                               | Start or stop local PostgreSQL 18                    |
| `pnpm run doctor`                                    | Local environment diagnostics                        |

Run a single workspace with `pnpm --filter @multi-site-cms/api <script>`.

## Repository layout

```text
apps/
  admin/                  Centralized administration shell
  api/                    NestJS API (global prefix /api/v1)
  sites/travel-blog/      Public publication (independent deployable)
  sites/air-sports/       Public publication (independent deployable)
packages/
  types/                  Framework-free API contract types
  validation/             Shared Zod schemas
  config/                 Platform constants, validated public config, headers
  api-client/             Framework-free JSON transport
  redux/                  Store factory, RTK Query base API, typed hooks
  ui/                     Presentation primitives and token contract
  tsconfig/               Shared TypeScript configuration
  eslint-config/          Shared ESLint configuration
infrastructure/docker/    PostgreSQL 18 Compose service and extensions
docs/                     Architecture, security, development, deployment, ADRs
.agent/skills/            Project-local agent skills
e2e/                      Playwright smoke tests
scripts/                  Repository tooling
```

## Documentation

Start at [docs/README.md](docs/README.md). Architectural decisions are recorded
in [docs/adr/README.md](docs/adr/README.md). Contributors and AI agents must
read [AGENTS.md](AGENTS.md) before changing code.

## Phase boundary

Phase 02 adds authentication, the database schema, content, media, and
publishing. It begins only after the entry gate in
[phase-01-scope.md](docs/product/phase-01-scope.md) is approved. Nothing in the
design documents authorizes implementing Phase 02 work early.
