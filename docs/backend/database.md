# Database integration

How Nest uses the Phase 02 schema: one options factory, one `DataSource`, lazy
connection, migrations only.

## Wiring

| Piece                        | Responsibility                                                     |
| ---------------------------- | ------------------------------------------------------------------ |
| `database-options.ts`        | The only place `DataSourceOptions` are built (runtime, CLI, tests) |
| `database.module.ts`         | Global module providing `DATA_SOURCE`, shutdown cleanup, probe     |
| `database.tokens.ts`         | Token, isolated to avoid a provider↔consumer import cycle          |
| `database-health.service.ts` | Readiness probe: `SELECT 1` with a 2s ceiling                      |
| `data-source.ts`             | TypeORM CLI entry point (`migration:run/show/revert/generate`)     |
| `entities/index.ts`          | Explicit registry of the 18 entities                               |
| `migrations/index.ts`        | Explicit ordered registry of the 3 migrations                      |

`synchronize` is `false` in the shared options, so every path — runtime, CLI, tests,
scripts — inherits migrations-only behavior. There is no configuration flag that can
turn it on.

## Connection lifecycle

The pool is created but **not opened** at bootstrap. It opens on first use:

- the readiness probe initializes it, or
- a future repository/service issues its first query.

Why: Phase 03 has no query-serving feature. Connecting at boot would make local runs,
CI, and the liveness probe depend on a database for no benefit, and would turn a
database outage into a crash-loop instead of a red readiness check.

`DatabaseLifecycle` destroys the pool on application shutdown. A failed
initialization is dropped by the probe so the next check starts clean rather than
queueing behind a broken attempt.

## Pool sizing

`max: 10` per instance, with a 10s connect timeout. The pool is deliberately
conservative because free-tier PostgreSQL plans cap total connections, and the pool
must be re-evaluated together with the number of API instances — not independently.
Ten instances of a 10-connection pool is 100 connections, which most free plans
reject.

## Readiness versus liveness

| Endpoint                   | Question                                      | On failure                 |
| -------------------------- | --------------------------------------------- | -------------------------- |
| `GET /api/v1/health`       | Can the process serve HTTP?                   | — (always 200 while alive) |
| `GET /api/v1/health/ready` | Can it serve requests that need the database? | 503 `SERVICE_UNAVAILABLE`  |

The readiness check runs `SELECT 1`, not a table query: it costs almost nothing, does
not require migrations to have run, and answers exactly the deployment question.
Responses never include the DSN, host, or database name.

Use liveness for restart policy and readiness for traffic routing. Pointing a
restart policy at readiness turns a database blip into a pod restart storm.

## Migration workflow

```bash
pnpm --filter @multi-site-cms/api build                 # CLI runs compiled output
DATABASE_URL=… pnpm --filter @multi-site-cms/api db:migration:run
DATABASE_URL=… pnpm --filter @multi-site-cms/api db:migration:show
DATABASE_URL=… pnpm --filter @multi-site-cms/api db:migration:revert   # local only
DATABASE_URL=… pnpm --filter @multi-site-cms/api db:seed:dev
pnpm --filter @multi-site-cms/api db:migration:generate src/database/migrations/Name
```

Migrations run as a separate deploy step, once, from a single instance. They never
run on application start.

## Tests

| Suite              | Command                            | Needs PostgreSQL          |
| ------------------ | ---------------------------------- | ------------------------- |
| Unit and HTTP      | `pnpm --filter … test`             | no                        |
| Schema/integration | `pnpm --filter … test:integration` | yes (`TEST_DATABASE_URL`) |

Integration suites cover the 18 tables and 3 migrations, constraint behavior, the
readiness path against a live and an unreachable database, and entity discovery.
They refuse to run against a database whose name does not end in `_test`, because
they drop and recreate the `public` schema.

## Failure modes

| Symptom                                 | Cause                                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| `Invalid API environment configuration` | Malformed `DATABASE_URL` or a non-PostgreSQL scheme        |
| Readiness 503 with a healthy process    | Database unreachable, wrong credentials, pool exhausted    |
| `relation "…" does not exist`           | Migrations not applied to that database                    |
| Migration CLI prints nothing            | Built artifact is stale; run `pnpm --filter … build` first |
