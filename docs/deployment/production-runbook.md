# Production runbook (free tier: Neon, Render, Vercel)

Status: prepared in Phase 9. Values marked 🔒 are secrets: set them in the
provider dashboards only. Local copies live in the git-ignored `.env.prod`
files (`apps/api`, `apps/admin`, `apps/sites/*`).

## Topology

| Part        | Host              | Notes                                                          |
| ----------- | ----------------- | -------------------------------------------------------------- |
| API         | Render (free)     | One instance only (ADR-0028); sleeps after 15 min idle         |
| Database    | Neon (free)       | Pooled endpoint, `sslmode=verify-full`; compute idles at 5 min |
| Media       | Cloudinary (free) | Render's disk is wiped on every deploy                         |
| Admin       | Vercel            | Proxies `/api/v1/*` to the API (same-origin cookies, SEC-22)   |
| Travel, Air | Vercel            | Server-side fetches with a 10 s timeout; ISR 60 s              |

## Render (API)

- Root directory: empty (repository root; the API uses workspace packages).
- Build: `corepack enable && pnpm install --frozen-lockfile --prod=false && pnpm turbo run build --filter=@multi-site-cms/api...`
- Start: `pnpm --filter @multi-site-cms/api db:migration:run && pnpm --filter @multi-site-cms/api bootstrap:platform && pnpm --filter @multi-site-cms/api start`
  (migrations and the role/permission bootstrap are idempotent; free plans have
  no pre-deploy step).
- Health check path: `/api/v1/health`. Build filters: `apps/api/**`,
  `packages/**`, `pnpm-lock.yaml`, `package.json`.
- Environment: everything in `apps/api/.env.prod` except `PORT` (Render sets
  it), plus `NODE_VERSION=24.11.0`. 🔒 `DATABASE_URL`, `CLOUDINARY_URL`,
  `PREVIEW_TOKEN_SECRET`, `REVALIDATE_SECRET`.
- `CORS_ORIGINS` must list **all three** frontend origins (the CSRF guard checks
  `Origin`, also for proxied admin requests).

## Vercel (three projects, same repository)

| Project     | Root directory           | Environment                                                                                                                                 |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin       | `apps/admin`             | `NEXT_PUBLIC_API_URL=<admin origin>/api/v1`, `API_PROXY_TARGET=<API origin>`, `NEXT_PUBLIC_APP_URL`                                         |
| Travel blog | `apps/sites/travel-blog` | `NEXT_PUBLIC_API_URL=<API>/api/v1`, `NEXT_PUBLIC_APP_URL`, 🔒 `REVALIDATE_SECRET`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_CONTACT_PHONE` |
| Air sports  | `apps/sites/air-sports`  | same as travel blog                                                                                                                         |

All three: `ENABLE_EXPERIMENTAL_COREPACK=1`, Node.js 24.x. `NEXT_PUBLIC_*`
values are compiled into the bundle: changing them needs a redeploy.

## First deployment, in order

1. Render: create the service with the settings above; wait for "Live" and
   open `/api/v1/health` (200).
2. Vercel: deploy the three projects (wake the API first: the sites prerender
   from it).
3. Put the real Vercel URLs into Render `CORS_ORIGINS`, `SITE_REVALIDATE_URLS`
   and the admin's `NEXT_PUBLIC_API_URL`; redeploy both.
4. Create the first Super Admin from your own machine (password typed in the
   terminal, never stored; at least 12 characters, upper, lower, digit):
   ```bash
   pnpm --filter @multi-site-cms/api build
   cd apps/api
   SUPER_ADMIN_EMAIL='owner@example.com' SUPER_ADMIN_NAME='Owner Name' \
   SUPER_ADMIN_PASSWORD='<typed here>' node --env-file=.env.prod dist/database/cli/bootstrap-super-admin.js
   ```
   Then clear the shell history line that contains the password.
5. Seed the launch content (sites, verified primary domains from
   `SITE_REVALIDATE_URLS`, taxonomy, 13 articles for readers in Bangladesh with
   illustrated covers uploaded to Cloudinary). Idempotent; safe to re-run:
   ```bash
   cd apps/api && pnpm build
   node --env-file=.env.prod dist/database/cli/seed-production-content.js --confirm
   ```
   Then add other users (e.g. site Admins) from Users → Add user.
6. Monitoring and keep-alive: UptimeRobot (free) HTTP monitor on
   `/api/v1/health` every 5 minutes with email alerts; optionally set the
   GitHub repository variable `API_HEALTH_URL` to enable
   `.github/workflows/keep-alive.yml` as a backup.

## After the first deploy, verify

- Sign-in works on the admin origin; cookies are `Secure; HttpOnly` (session)
  and scoped to the admin host.
- `req.ip` in audit events shows real client IPs, not one proxy IP (TD-16);
  adjust `TRUST_PROXY` if not.
- Publishing a post revalidates the site within seconds (webhook), not 60 s.
- Media upload lands in Cloudinary.

## Rollback

- Code: Render and Vercel → redeploy the previous successful deployment.
- Database: migrations are additive in Phase 9; to undo the latest one run
  `pnpm --filter @multi-site-cms/api db:migration:revert` locally with
  `node --env-file=.env.prod` semantics, after a Neon branch/backup.
- Neon keeps point-in-time history on the free plan for a limited window;
  create a branch before risky changes.

## Turborepo environment (strict mode)

Turborepo 2 passes only declared environment variables to tasks. Vercel and CI
both build and test through turbo, so a variable missing from `turbo.json` is
silently empty there (locally it may still "work" through defaults). Declare:

- build-time variables (`NEXT_PUBLIC_*`, anything read in `next.config.ts`) in
  `tasks.build.env` or `globalEnv`;
- test connection strings in `tasks.test.passThroughEnv` (not hashed into the
  cache key).

Runtime-only server variables (e.g. `REVALIDATE_SECRET` in a route handler)
come from the hosting platform at request time and need no declaration.

## Local operator commands

With `NODE_ENV=production` the API does not read the development `.env`, so
`node --env-file=.env.prod …` uses production values only (previously, missing
keys such as Cloudinary credentials were filled in from development).

### Starting About page copy

`seed:about` gives each site a starting About page so the public page is not
empty. Idempotent: a site whose owner already wrote an About page is skipped;
`--force` overwrites. It writes only `settings.about`, never other settings.

```
pnpm --filter @multi-site-cms/api build
node --env-file=.env.prod apps/api/dist/database/cli/seed-about-content.js --confirm
```

The copy lives in `seeds/about-content.ts` and is a draft for the owner to
rewrite in the admin (Content, About page). Run it against production only with
the operator's go-ahead.
