# Migrations and recovery

## Creating a migration

1. Read [data dictionary](data-dictionary.md) and [ERD](erd.md) first.
2. Change the entity, then hand-write the migration under
   `apps/api/src/database/migrations/` with a timestamp-prefixed name
   (`1793491203000-AddRedirects.ts`).
3. Register it in `apps/api/src/database/migrations/index.ts`. The registry is
   explicit; nothing is globbed.
4. Add the `up` and the `down`. The `down` must actually restore the previous
   shape for local development.
5. Add constraints before code depends on them. Split a backfill from the
   constraint that needs it into two migrations.
6. Add an integration test that fails without the change and asserts the
   constraint or behavior you added.

Generate-on-diff (`typeorm migration:generate`) is acceptable as a starting
point, but the generated file is reviewed and usually edited: it must not drop
data, rename columns destructively, or invent index names.

## Running migrations

```bash
# 1. Build: the CLI runs compiled JavaScript from dist/
pnpm --filter @multi-site-cms/api build

# 2. Apply
DATABASE_URL=postgresql://user:pass@host:5432/db \
  pnpm --filter @multi-site-cms/api db:migration:run

# 3. Inspect what is applied
DATABASE_URL=... pnpm --filter @multi-site-cms/api db:migration:show
```

`migration:revert` exists for local development only. `DATABASE_URL` is validated
at startup like every other API variable; the CLI never reads a hardcoded
connection string.

## Local workflow

```bash
pnpm db:up                      # PostgreSQL 18 on :5432 (or POSTGRES_PORT)
cp apps/api/.env.example apps/api/.env
pnpm --filter @multi-site-cms/api build
pnpm --filter @multi-site-cms/api db:migration:run
pnpm --filter @multi-site-cms/api db:seed:dev
```

If port 5432 is already used by a native PostgreSQL, run the container elsewhere:

```bash
POSTGRES_PORT=5433 pnpm db:up
DATABASE_URL=postgresql://multi_site_cms:multi_site_cms_dev@localhost:5433/multi_site_cms \
  pnpm --filter @multi-site-cms/api db:migration:run
```

The container creates `citext` and `pg_trgm` on first initialization only. The
extension migration re-creates them with `IF NOT EXISTS`, which is what makes a
fresh schema (and the test harness) work on a managed provider too.

## Production workflow

1. Build and publish the API artifact.
2. Run migrations as a **separate deploy step**, once, from a single instance —
   never from application startup, and never concurrently from autoscaled instances.
3. Verify with `migration:show`.
4. Deploy the application version that expects the new schema.
5. Keep the previous artifact available for rollback.

Order matters for expand/contract changes: add the new shape, deploy code that
writes both, backfill, switch reads, then remove the old shape in a later release.

## Backward-compatible migration principles

- Additive first: new nullable column, new table, new index. Deployable on its own.
- Never rename a column in one step. Add, dual-write, backfill, drop.
- Never add a `NOT NULL` column without a default or a backfill in the same change.
- Creating an index on a large table should use `CREATE INDEX CONCURRENTLY`
  outside a transaction once tables are large; the migration runner wraps
  statements in a transaction by default, so use a non-transactional migration
  (`transaction = false`) and document why.
- Never change a check constraint and the data it constrains in the same step
  without a plan for rows that violate it.

## Rollback limitations

Be explicit with stakeholders: **a migration that changed data is not reversible
by running `down`.**

- `down` restores structure, not deleted or transformed rows.
- A drop of a column or table loses its content permanently; the rollback is a
  restore from backup, not a `down` migration.
- After a destructive migration has run in production, the recovery plan is:
  stop writes, restore the last verified backup into a new database, replay
  accepted loss, cut over.
- Therefore destructive changes need a backup immediately before the deploy and a
  written confirmation of acceptable data loss.

## Backup expectations

| Environment | Backup                                                   |
| ----------- | -------------------------------------------------------- |
| Local       | None; `pnpm db:reset` recreates it                       |
| Preview     | None; disposable                                         |
| Staging     | Provider snapshot if available; otherwise a logical dump |
| Production  | Automated backups with point-in-time recovery, tested    |

Free tiers often provide no backups. If the chosen provider cannot, schedule a
`pg_dump` to external object storage and treat that as the backup of record. A
backup that has never been restored is not a backup.

## Restore drill

Run before real content exists, then quarterly:

1. Create an empty database on a separate instance.
2. Restore the latest dump, or restore the provider snapshot.
3. Run `migration:show` and confirm the schema matches the deployed version.
4. Verify row counts for `sites`, `post_publications`, `post_revisions`, and
   `media_assets`.
5. Load one published article through the public read path.
6. Record the date, duration, and any gap in this document.

## Handling a failed migration

| Situation                                      | Action                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Fails locally                                  | Fix the migration; the database is disposable                                     |
| Fails before committing partial DDL            | The runner rolls back the transaction; correct and re-run                         |
| Fails mid-way in a non-transactional migration | Manually repair to a known state, then re-run a corrected forward migration       |
| Left the schema applied but not recorded       | Insert the row into `typeorm_migrations` only after verifying every object exists |
| Applied in production with a defect            | Ship a forward fix. Do not `revert` in production                                 |

Never edit an applied migration to "fix" it. Other environments already ran the
old version, and the checksums are not tracked, so the divergence is silent.

## Verifying this phase

The Phase 02 chain was executed against PostgreSQL 18.6 and then reverted and
re-applied to prove `down()` works:

```bash
pnpm --filter @multi-site-cms/api build
pnpm --filter @multi-site-cms/api db:migration:run     # 3 migrations
pnpm --filter @multi-site-cms/api db:migration:revert  # x3
pnpm --filter @multi-site-cms/api db:migration:run     # re-apply
pnpm --filter @multi-site-cms/api db:seed:dev          # idempotent
pnpm --filter @multi-site-cms/api test:integration     # 38 assertions
```
