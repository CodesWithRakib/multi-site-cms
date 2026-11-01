# Troubleshooting

Start with `pnpm run doctor` (bare `pnpm doctor` invokes pnpm's own built-in
command instead). It checks Node and pnpm versions, required files, the
install state, `.env` presence, Docker availability, and port conflicts.

## Install

**`ERR_PNPM_OUTDATED_LOCKFILE`** — `pnpm-lock.yaml` is out of date. Run
`pnpm install` locally and commit the lockfile; do not delete it in CI.

**`ERR_PNPM_UNSUPPORTED_ENGINE`** — Node or pnpm is older than `engines` allows.
Use Node 24+ (`.nvmrc`) and pnpm 12.4.2 (`corepack use pnpm@12.4.2`).

**A package's postinstall did not run** — pnpm blocks lifecycle scripts. Add the
package to `allowBuilds` in `pnpm-workspace.yaml` only after confirming the script
is necessary, then reinstall.

**Mixed node_modules / odd type errors** — someone ran `npm install` inside a
workspace. Remove all `node_modules`, then `pnpm install` from the root.

## Ports

Ports 3000–3002 (web) and 4000 (API), 5432 (Postgres) are expected.

```bash
# macOS / Linux / Git Bash
netstat -ano | grep -E ':(3000|3001|3002|4000|5432)'
```

Either stop the other process or change the app's port in its `dev`/`start` script
and the corresponding Playwright `E2E_*_URL`.

## Database

**`pnpm db:up` fails with an extension error** — the volume was initialized by an
older image. `pnpm db:reset` recreates it; extensions only run on first init.

**`password authentication failed`** — the volume kept credentials from an earlier
run. `pnpm db:reset`, or align `POSTGRES_*` variables with `DATABASE_URL`.

**Data directory warnings after an image upgrade** — PostgreSQL 18 uses
`/var/lib/postgresql/18/docker`; the Compose file mounts the pre-18 correct path
for 18 (`/var/lib/postgresql`). Do not copy a pre-18 data directory into it.

**`ECONNREFUSED 127.0.0.1:5432` from the API** — Postgres is not running, or
`DATABASE_URL` points elsewhere. Check `pnpm db:logs` and the health check.

## API

**API exits immediately with "Invalid API environment configuration"** — it
validates at startup by design. Read the listed issues; usually a malformed
`CORS_ORIGINS` entry or a non-PostgreSQL `DATABASE_URL`.

**Browser requests fail with CORS** — the origin must appear in `CORS_ORIGINS`
exactly (scheme, host, port, no trailing slash).

**Everything returns 429** — the global throttle is 120 requests/minute/IP. Wait,
or raise the limit deliberately rather than disabling the guard. Behind a proxy,
set `TRUST_PROXY` so the client IP is correct.

**`/health` returns but the app looks broken** — health is liveness only. It does
not prove database connectivity; there is no readiness endpoint yet.

## Next.js

**A page renders blank with a hydration warning** — a Client Component is
rendering different output on server and client (time, random, `window` at render).
Move the value into an effect or render server-side.

**New package import fails to resolve** — the package must be listed in the
application's `transpilePackages` and its `exports` must point at source.

**`robots` and metadata look wrong** — metadata is per route; the admin app sets
noindex intentionally.

## Tests

**`Executable doesn't exist … chromium`** — `pnpm exec playwright install
chromium`.

**Playwright fails with "port already in use"** — an app is already running.
Local runs reuse existing servers unless `CI` is set; stop the stray process or
reuse it deliberately.

**Jest fails on ESM/Nest decorators** — API tests run through `ts-jest` with
`node --experimental-vm-modules` (see `apps/api/package.json`). Do not change that
invocation without running the full suite.

## Lint and types

**`@typescript-eslint/no-explicit-any`** — model the type instead of suppressing.

**`no-restricted-imports` for `@multi-site-cms/*/src/*`** — add the missing export
to the package entry point rather than widening the rule.

**TypeScript finds files it should not** — workspace tsconfigs extend
`packages/tsconfig`; check the `include`/`exclude` rather than adding `skipLibCheck`
or cast-based workarounds.

## Docker

**Compose says the image platform does not match** — on Apple Silicon, the
official `postgres:18-alpine` image is multi-arch; if a cached amd64-only layer is
pulled, `docker pull --platform=linux/arm64 postgres:18.6-alpine`.

**Volume left behind** — `pnpm db:reset` removes the named volume
`multi-site-cms-postgres-data`.
