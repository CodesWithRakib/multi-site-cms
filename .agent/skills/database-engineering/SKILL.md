# Skill: database-engineering

## Purpose

Own the PostgreSQL schema: entities, constraints, indexes, migrations, and
transaction boundaries that keep tenant data correct under concurrency.

## When to use

Any change to entities, migrations, queries, indexes, or data ownership. Also
when a feature needs a new table, column, relationship, or uniqueness rule.

## Mandatory rules

1. **Migrations only.** `synchronize: false` in every environment. Every schema
   change is a reviewed TypeORM migration; reverts are a new forward fix in
   production.
2. **Database and application both enforce integrity.** Foreign keys, unique
   constraints, check constraints, and NOT NULL are not optional because "the
   service validates it".
3. **Every tenant-owned row is reachable from a site.** Include `site_id` (or a
   composite key containing it) so queries never scan other tenants.
4. **Foreign keys are explicit.** Use `ON DELETE RESTRICT` for references that
   require a migration/reassignment workflow; reserve `CASCADE` for genuine
   owned children and document it.
5. **Transactions for multi-step writes.** Publication changes, role assignment,
   and any write that touches more than one table run in one transaction.
6. **Access paths get indexes.** Add an index with the query that needs it and
   name the query in the migration. No hypothetical indexes.
7. **No secrets or PII in logs.** Do not `console.log` connection strings or row
   contents. Schema changes that store personal data require a documented
   retention rule.
8. **Follow the ERD.** If the implementation needs a different shape, update
   `docs/architecture/erd.md` and the ADR before writing the migration.

## Workflow

1. Read `docs/database/erd.md`, `docs/database/data-dictionary.md`, and
   `docs/database/multi-site-data-isolation.md`.
2. Decide the table, columns, keys, and which application module owns writes.
3. Check the isolation story: can this row be fetched with a `site_id`
   constraint? If not, redesign it.
4. Write the migration, then the entity, then the query.
5. Add a constraint before code depends on it; split backfill from constraint.
6. Test with two tenants where the feature is tenant-scoped.
7. Update the ERD table notes if the shape changed.

## Anti-patterns

- `synchronize: true` in development leaking into a deployed environment.
- Authorization by primary key alone: `findOne({ where: { id } })` on a
  site-scoped entity (IDOR).
- JSON columns used for relationships that need referential integrity.
- Storing derived totals with no recomputation or constraint plan.
- Using timestamps without timezone; always `timestamptz` (UTC).
- A partial unique index that is mistaken for full uniqueness (or the reverse).
- Deleting audit history; audit tables are append-only for the app role.

## Review checklist

- [ ] Migration is reversible in development and forward-only in production.
- [ ] FKs, uniques, checks, and NOT NULL exist where the domain requires them.
- [ ] Tenant scope is enforced in the schema and in the query.
- [ ] Multi-step write is transactional.
- [ ] Indexes match real access paths, including the tenant filter.
- [ ] No raw string SQL without parameters.
- [ ] ERD/design doc updated with non-secret schema facts.

## Project references

- `docs/database/README.md`
- `docs/database/erd.md`
- `docs/database/data-dictionary.md`
- `docs/database/multi-site-data-isolation.md`
- `docs/database/migrations-and-recovery.md`
- `apps/api/src/database/database-options.ts`
- `apps/api/src/database/migrations/`
- `infrastructure/docker/init/01-extensions.sql`
