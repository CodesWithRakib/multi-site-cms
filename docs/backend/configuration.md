# Configuration

Every value is parsed and validated once at startup by
`apps/api/src/config/env.ts` using Zod. An invalid value fails the process with a
list of issues — and never with the values themselves, because the object contains
a credential-bearing database URL.

## Variables

| Variable               | Required        | Default                        | Validation                                                  |
| ---------------------- | --------------- | ------------------------------ | ----------------------------------------------------------- |
| `NODE_ENV`             | no              | `development`                  | `development` \| `test` \| `production`                     |
| `HOST`                 | no              | `0.0.0.0`                      | non-empty string                                            |
| `PORT`                 | no              | `4000`                         | integer 1–65535                                             |
| `API_PREFIX`           | no              | `api/v1`                       | lowercase segments, no leading slash                        |
| `CORS_ORIGINS`         | production only | localhost:3000–3002            | comma-separated absolute `http(s)` URLs                     |
| `DATABASE_URL`         | production only | local Compose database         | `postgresql://` or `postgres://`                            |
| `TRUST_PROXY`          | no              | `0`                            | integer 0–10                                                |
| `LOG_LEVEL`            | no              | `info`                         | `debug` \| `info` \| `warn` \| `error` \| `silent`          |
| `BODY_LIMIT`           | no              | `1mb`                          | `<number><b                                                 | kb                               | mb>` |
| `DOCS_ENABLED`         | production only | `false`                        | `true` \| `false`                                           |
| `TEST_DATABASE_URL`    | no (tests)      | derived from the default       | must end with `_test` for destructive suites                |
| `API_BASE_URL`         | production only | `http://localhost:4000/api/v1` | absolute `http(s)` URL; not localhost in production         |
| `STORAGE_PROVIDER`     | no              | `local`                        | `local`                                                     | `cloudinary` (needs credentials) |
| `PREVIEW_TOKEN_SECRET` | production only | random per process             | at least 32 characters                                      |
| `REVALIDATE_SECRET`    | no              | unset (revalidation skipped)   | at least 16 characters                                      |
| `SITE_REVALIDATE_URLS` | no              | empty                          | `site-key=http(s)://host` pairs, comma-separated (ADR-0026) |

## Production rules

`parseEnv` enforces intent, not just shape:

1. `DATABASE_URL` and `CORS_ORIGINS` must be **present in the environment**. A
   development default is never silently promoted to production.
2. `CORS_ORIGINS` must not contain `localhost`, `127.0.0.1`, `0.0.0.0`, or `::1`.
3. OpenAPI is disabled unless `DOCS_ENABLED=true` (there is no authentication yet).
4. Nothing is logged at startup except the bind address and the docs state.

## CORS by environment

| Environment | Origins                                                     |
| ----------- | ----------------------------------------------------------- |
| Local       | `http://localhost:3000`, `3001`, `3002` (admin + two sites) |
| Preview     | The preview domains of each application, per branch         |
| Staging     | Staging admin and staging public sites                      |
| Production  | Only the real admin and public domains                      |

Wildcards with credentials are not supported and must not be introduced. A missing
origin appears as a browser CORS failure, not a server error, so add it before
reviewing a preview.

## Secrets

- `.env.example` contains placeholders and development values only.
- `.env*` files are ignored by Git; only the examples are tracked.
- Production values come from the host's secret store.
- The database URL is redacted from logs by key name; do not log raw environment
  objects.
- See [secrets](../security/secrets.md).

## Changing configuration

Adding a variable requires, in one change:

1. the schema entry and its validation,
2. `.env.example`,
3. this document,
4. the deployment environment (secret store or dashboard),
5. a test for the new rule if it has a non-trivial constraint.
