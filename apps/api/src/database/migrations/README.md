# Migrations

Migrations are the only supported mechanism for changing the schema. TypeORM
`synchronize` is `false` in every environment.

## Current chain

| Timestamp       | Migration                  | Contents                                                                      |
| --------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `1793491200000` | `EnableDatabaseExtensions` | `citext`, `pg_trgm` (`IF NOT EXISTS`, no-op down)                             |
| `1793491201000` | `IdentityAndSiteRegistry`  | users, roles, permissions, role grants, assignments, sites, domains           |
| `1793491202000` | `ContentMediaAndAudit`     | categories, tags, events, media, posts, revisions, publications, joins, audit |

Register every new migration in `index.ts`. The registry is explicit on purpose.

## Rules

1. One logical change per migration, forward-only in production.
2. `down()` must restore the previous structure for local development. A migration
   that changed data is not safely reversible; see
   [migrations and recovery](../../../../../docs/database/migrations-and-recovery.md).
3. Never edit an applied migration outside a disposable local database.
4. Add constraints before application code relies on them; split backfill from the
   constraint that requires it.
5. Build before running the CLI — it executes compiled files in `dist/`.

## Commands

```bash
pnpm --filter @multi-site-cms/api build
DATABASE_URL=... pnpm --filter @multi-site-cms/api db:migration:run
DATABASE_URL=... pnpm --filter @multi-site-cms/api db:migration:show
DATABASE_URL=... pnpm --filter @multi-site-cms/api db:migration:revert   # local only
DATABASE_URL=... pnpm --filter @multi-site-cms/api db:seed:dev            # idempotent, refuses production
```

## Verification

The chain has been applied to PostgreSQL 18.6, reverted three times, and
re-applied. The integration suite
(`pnpm --filter @multi-site-cms/api test:integration`) drops and recreates the
`public` schema and applies the chain from empty on every run, so a broken
migration fails CI rather than a reviewer's manual check.
