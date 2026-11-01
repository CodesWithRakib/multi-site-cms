# ADR-0007: PostgreSQL with TypeORM and explicit migrations

- Status: Accepted
- Date: 2026-11-01
- Owners: database + platform engineering

## Context

Phase 01 prepared a TypeORM CLI data source but created no entities and no
migrations. Phase 02 must define the persistence stack that every later phase
inherits: database engine, ORM, schema-change mechanism, and configuration source.

The requirements are relational integrity (tenants, foreign keys, composite
uniqueness), JSON documents for editor content, case-insensitive identity fields,
and a free-tier-friendly operational story. The team is small and AI-assisted, so
the stack must be one obvious way, not a choice per feature.

## Decision

- **PostgreSQL 18** as the only database engine, locally through
  `infrastructure/docker/docker-compose.yml` and later a managed provider.
- **TypeORM** as the only ORM, used for entity metadata, migrations, and
  parameterized queries.
- **Explicit, hand-reviewed migrations**; `synchronize` is `false` in every
  environment and cannot be switched on by configuration.
- A single options factory (`apps/api/src/database/database-options.ts`) is shared
  by the runtime module, the CLI, and integration tests.
- Extensions `citext` and `pg_trgm`, provisioned by an idempotent migration as well
  as the Docker init script.
- Text columns with `CHECK` constraints instead of native enums for evolving
  vocabularies (statuses, types).

## Alternatives considered

| Option                             | Why not                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Prisma                             | Excellent DX, but a second query layer and generator step; the project already standardized TypeORM in Phase 01 |
| Drizzle                            | Lean, but would replace the established ORM and its CLI                                                         |
| `synchronize: true` in development | Divergence between environments and unaudited DDL; the cause of most "works locally" incidents                  |
| Native PostgreSQL enums            | Value changes require `ALTER TYPE` migrations; cheap to add now, painful later                                  |
| MySQL / MariaDB                    | Weaker partial-index and `citext` equivalents; JSONB and constraints are better here                            |
| Document database (e.g. MongoDB)   | Tenant isolation and referential integrity are the core requirement; relational wins                            |
| Schema-per-tenant                  | 18 tables × N sites with duplicated migrations; no isolation benefit at two sites                               |

## Consequences

Positive: one stack, real constraints, `EXPLAIN`-able queries, portable to any
managed PostgreSQL, migrations reviewable in a diff, CI can validate from an empty
schema.

Negative: migrations are hand-written and must be ordered carefully; TypeORM's
metadata/DB drift is invisible while `synchronize` stays off (accepted — the
integration suite asserts behavior, and `migration:show` reports state). Text +
`CHECK` means a new status value is a one-line migration rather than a type change.

Accepted cost: contributors must build before running the CLI, because it executes
compiled output from `dist/`.

## Future migration considerations

If TypeORM becomes a bottleneck, introduce a query builder or a narrow data-access
helper — not a second ORM. Read replicas, partitioning, or RLS each require their
own ADR. Moving to another engine would be a foundational change that supersedes
this record.
