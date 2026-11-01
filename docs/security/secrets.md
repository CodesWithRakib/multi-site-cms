# Secrets management

## Rules

1. Only `.env.example` files are committed. `.env`, `.env.local`, and every
   `.env.*` exception are ignored by `.gitignore`.
2. A real value never appears in source, tests, documentation, commit messages,
   screenshots, or logs.
3. `NEXT_PUBLIC_*` values are public forever: they are inlined into the browser
   bundle at build time. Never put a database URL, API secret, or token there.
4. Production values live in the hosting provider's secret store and are injected
   at runtime or build time by the platform, never copied through a repository.
5. The API validates environment configuration at startup and fails fast, so a
   missing secret is a deployment error rather than a runtime surprise.
6. Rotation is a redeploy: change the value in the secret store, restart, verify.
   A leaked value is rotated immediately, not "next sprint".

## Variables by application

| Application  | Variable              | Sensitivity | Notes                                 |
| ------------ | --------------------- | ----------- | ------------------------------------- |
| API          | `DATABASE_URL`        | secret      | Full DSN with credentials             |
| API          | `CORS_ORIGINS`        | internal    | Comma-separated absolute origins      |
| API          | `PORT`, `HOST`        | public      | Bind configuration                    |
| API          | `TRUST_PROXY`         | internal    | Must match the real proxy depth       |
| API          | `NODE_ENV`            | public      | `development` / `test` / `production` |
| Admin, sites | `NEXT_PUBLIC_API_URL` | public      | Browser-visible API base              |
| Admin, sites | `NEXT_PUBLIC_APP_URL` | public      | Canonical origin of that application  |

Phase 02 will add session signing keys, an object-storage credential, and mail
credentials if email is adopted. Each is documented here when it lands, with its
scope and rotation procedure.

## Local development

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
```

The example values are development-only and are safe because they grant access
only to a disposable local database. They must never be reused in a deployed
environment.

## Production checklist

- [ ] Every variable is set in the platform secret store for each environment.
- [ ] No variable is duplicated between staging and production values.
- [ ] The database deployment user is not a superuser and has only the privileges
      the application needs.
- [ ] Secrets are not echoed in build logs or CI output.
- [ ] The CI token is scoped to the repository and revocable.
- [ ] A rotation has been rehearsed once before real content exists.

## Incident response for a leaked secret

1. Rotate the credential at the source (database, hosting, provider).
2. Redeploy so no instance keeps running with the old value.
3. Assess exposure: logs, bundles, screenshots, artifacts, git history.
4. If it reached git history, treat the credential as permanently compromised;
   rotation, not history rewriting, is the fix.
5. Record the cause and the added control in the threat model.

## Free-tier constraints

Free tiers often limit the number of environment variables, secret rotation
tooling, and audit visibility. Document the limit for the chosen provider in
[free-tier deployment](../deployment/free-tier-deployment.md) and design around
it: few variables, one source of truth per value, no per-branch secret copies.
