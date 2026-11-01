# Getting started

## 1. Prerequisites

| Tool    | Required | Verify                   |
| ------- | -------- | ------------------------ |
| Node.js | 24.11+   | `node --version`         |
| pnpm    | 12.4.2+  | `pnpm --version`         |
| Docker  | any      | `docker compose version` |
| Git     | any      | `git --version`          |

Install the pinned pnpm with Corepack:

```bash
corepack enable
corepack use pnpm@12.4.2
```

## 2. Install

```bash
git clone <repository-url> multi-site-cms
cd multi-site-cms
pnpm install
```

Always install from the repository root. A workspace package's `node_modules` is
managed by pnpm; running `npm install` inside an app will corrupt the graph.

## 3. Environment files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/sites/travel-blog/.env.example apps/sites/travel-blog/.env
cp apps/sites/air-sports/.env.example apps/sites/air-sports/.env
```

The defaults work locally. They are development-only values; see
[secrets](../security/secrets.md).

## 4. Database

Only needed for migration work. Phase 01 has no application tables.

```bash
pnpm db:up      # PostgreSQL 18 on localhost:5432
pnpm db:logs    # follow logs
pnpm db:down    # stop, keep data
pnpm db:reset   # stop and delete the volume
```

The container creates the `citext` and `pg_trgm` extensions on first
initialization only. If you change the init scripts, recreate the volume.

## 5. Run

```bash
pnpm dev
```

| Application     | URL                                       |
| --------------- | ----------------------------------------- |
| Admin           | http://localhost:3000                     |
| Travel blog     | http://localhost:3001                     |
| Air sports live | http://localhost:3002                     |
| API liveness    | http://localhost:4000/api/v1/health       |
| API readiness   | http://localhost:4000/api/v1/health/ready |
| API docs        | http://localhost:4000/api/v1/docs         |

Or run one workspace:

```bash
pnpm --filter @multi-site-cms/api dev
pnpm --filter @multi-site-cms/admin dev
```

## 6. Verify the checkout

```bash
pnpm run doctor      # environment diagnostics
pnpm lint
pnpm typecheck
pnpm test
pnpm build
TEST_DATABASE_URL=postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms_test \
  pnpm --filter @multi-site-cms/api test:integration
pnpm test:e2e:list   # Playwright discovery without starting servers
pnpm test:e2e        # full smoke suite; starts all four apps
```

`pnpm test:e2e` requires browsers once per machine:

```bash
pnpm exec playwright install chromium
```

## First-day reading

1. [`AGENTS.md`](../../AGENTS.md) — non-negotiable rules.
2. [Architecture overview](../architecture/overview.md).
3. [Monorepo structure](../architecture/monorepo-structure.md).
4. [Phase 01 scope](../product/phase-01-scope.md) — what is deliberately absent.
5. The skill for the area you will touch, in `.agent/skills/`.

## Common first-run problems

See [troubleshooting](troubleshooting.md). The most common cause is a port already
in use or a Postgres volume created by an older image version.
