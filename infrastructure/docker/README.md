# Local PostgreSQL

PostgreSQL 18.6 runs in Docker for development and tests. It is not a
production deployment and uses a local-only development password.

## Start and stop

From the repository root:

```bash
pnpm db:up
pnpm db:logs
pnpm db:down
```

`pnpm db:reset` deletes the named volume and every local row. Use it only when
you intend to reinitialize the database.

## Connection

The API defaults match this container:

```text
postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms
```

Override `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, or
`POSTGRES_PORT` through the shell or an untracked compose `.env` file. If you
change them, update `apps/api/.env` to match.

## Initialization

`init/01-extensions.sql` runs only when the data volume is empty. It enables
`citext` and `pg_trgm` for the application database. Re-running the container
will not re-apply it.

PostgreSQL 18 uses `/var/lib/postgresql/18/docker` as `PGDATA` and the image
volume is mounted at `/var/lib/postgresql`. Mounting the old
`/var/lib/postgresql/data` path would silently create an anonymous volume and
lose data when the container is recreated.

## Phase 01 schema state

There are no runtime entities or migrations yet. The TypeORM CLI data source is
configured, but Phase 02 adds the first reviewed migration. Do not enable
`synchronize` to create tables ad hoc.
