# Migrations

Migrations are the only supported mechanism for changing the production schema.

- Generate or write migrations only after the entity/relationship design is approved.
- Use deterministic, reviewer-friendly names: `1700000000000-create-sites-and-domains.ts`.
- Never edit a migration that has been applied outside a local disposable database.
- Run `pnpm --filter @multi-site-cms/api build` before invoking the compiled TypeORM CLI.
- Test migrations against a fresh database and a realistic restored copy before production.

No domain migrations exist in Phase 01 by design. The schema is specified in
`docs/database/DATABASE_DESIGN.md` and will be implemented with tests in the
persistence phase.
