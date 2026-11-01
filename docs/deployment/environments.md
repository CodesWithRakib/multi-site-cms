# Environment strategy

## Environments

| Environment | Purpose                        | Data                       | Access                 |
| ----------- | ------------------------------ | -------------------------- | ---------------------- |
| Local       | Development and unit tests     | Disposable Docker Postgres | Developer              |
| Preview     | Per-branch UI review           | Synthetic, resettable      | Team (hosting)         |
| Staging     | Release candidate verification | Synthetic or anonymized    | Team                   |
| Production  | Real publications              | Real content, backups on   | Operators, Super Admin |

No environment other than local may run with development defaults. The API fails
at startup if configuration is invalid, which is the intended behavior.

## Configuration model

- One code base, one build command, different environment variables.
- Server-only values (`DATABASE_URL`, `CORS_ORIGINS`, `TRUST_PROXY`) are provided by
  the host's secret store.
- Browser-visible values are limited to `NEXT_PUBLIC_*` and are public by
  definition.
- There are no committed per-environment files. `.env.example` documents the shape
  only.
- Local defaults exist for developer convenience (`localhost` URLs, development
  database credentials). They are never valid in a deployed environment.

## Variables per application

| Application    | Required                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| `apps/api`     | `NODE_ENV`, `DATABASE_URL`, `CORS_ORIGINS`, `PORT`, `HOST`, `TRUST_PROXY` |
| `apps/admin`   | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`                              |
| `apps/sites/*` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`                              |

`CORS_ORIGINS` must list every web origin that calls the API — admin and each
public site, per environment. A missing origin is a browser failure, not a server
error, so add it before the preview is reviewed.

## Startup validation

`apps/api/src/config/env.ts` parses the process environment with Zod and throws on
the first invalid configuration, listing every issue. Consequences:

- A typo fails the deploy instead of surfacing as a 500 later.
- Adding a variable means updating the schema, `.env.example`, this document, and
  the deployment configuration in the same change.

## Network and proxy

- The API binds `0.0.0.0` by default to work inside containers.
- `TRUST_PROXY` states the number of trusted proxy hops; keep it accurate so rate
  limiting sees real client IPs. Never set a high value "to make IPs work".
- CORS uses an explicit allowlist with credentials enabled, so no wildcard origin
  is possible.

## Data separation

- Local data is disposable; never restore it into production.
- Preview environments use a separate database or schema, never production.
- Production backups are provider-managed where available and verified by a
  documented restore drill before real content exists.

## Drift prevention

- CI installs with `--frozen-lockfile`; a dependency change is a code change.
- Runtime versions are pinned (`.nvmrc`, `packageManager`, `engines`).
- The same commands run locally and in CI: `lint`, `typecheck`, `test`, `build`.
- Environment changes are recorded here, not only in a hosting dashboard.

## Phase boundary

No production environment exists yet. Phase 01 provides the configuration
contract, the local environment, and the CI verification. Creating hosted
environments is part of the deployment decision that requires approval
([ADR 0006](../adr/0006-free-first-hosting.md)).
