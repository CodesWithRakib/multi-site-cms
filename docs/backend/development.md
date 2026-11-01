# Backend development workflow

## Commands

| Task               | Command                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Run the API        | `pnpm --filter @multi-site-cms/api dev`                                  |
| Build              | `pnpm --filter @multi-site-cms/api build`                                |
| Typecheck          | `pnpm --filter @multi-site-cms/api typecheck`                            |
| Lint               | `pnpm --filter @multi-site-cms/api lint`                                 |
| Unit + HTTP tests  | `pnpm --filter @multi-site-cms/api test`                                 |
| Integration tests  | `TEST_DATABASE_URL=… pnpm --filter @multi-site-cms/api test:integration` |
| Migrations         | `… db:migration:run` / `db:migration:show` / `db:migration:revert`       |
| Generate migration | `… db:migration:generate src/database/migrations/Name`                   |
| Development seed   | `… db:seed:dev`                                                          |
| Docs (local)       | http://localhost:4000/api/v1/docs                                        |

Run the CLI from a clean build: it executes `dist/`, not TypeScript sources.

## Adding an endpoint

1. Read [API standards](api-standards.md).
2. Create or extend the owning module (`identity`, `sites`, …). Do not add routes to
   `app.module`.
3. Define the DTO with class-validator; add `@Type` for deliberate conversions.
4. Keep the controller to parsing and delegation; put behaviour in a service.
5. Throw `ApiException(status, code, messageKey, { details })` for domain failures.
6. Add the response DTO with `@ApiProperty` and the `@Api…Response` decorators.
7. Add a catalog entry for any new message key in **both** locales.
8. Test: happy path, validation failure, not-found/forbidden path, and localization
   of at least one message.

## Adding configuration

Schema entry + `.env.example` + [configuration](configuration.md) + deployment
environment + a rule test. Never read `process.env` outside `config/env.ts`.

## Local database

```bash
pnpm db:up                                   # PostgreSQL 18 on :5432
POSTGRES_PORT=5433 pnpm db:up                # if 5432 is taken by another server
pnpm --filter @multi-site-cms/api build
DATABASE_URL=postgresql://multi_site_cms:multi_site_cms_dev@localhost:5433/multi_site_cms \
  pnpm --filter @multi-site-cms/api db:migration:run
```

Integration tests use `TEST_DATABASE_URL` and refuse any database whose name does
not end in `_test`.

## Debugging

- The correlation id appears in the response header, `meta.requestId`, and every log
  line for that request. Start there.
- Logs are single-line JSON. `LOG_LEVEL=debug` locally, `silent` in tests.
- Readiness tells you whether the database is the problem; liveness tells you whether
  the process is.
- `pnpm run doctor` from the repository root checks the wider environment.

## What not to do

- Do not read `process.env` in a controller or service.
- Do not build a response by hand; return data and let the interceptor wrap it.
- Do not write an error response in a controller; throw.
- Do not add an endpoint without a documented response type.
- Do not start Phase 04 work (auth, RBAC, content) in this phase.
