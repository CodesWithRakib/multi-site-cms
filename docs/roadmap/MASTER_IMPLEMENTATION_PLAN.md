# Master Implementation Plan

Derived from the 2026-11-04 audit in [docs/audit/](../audit/PROJECT_OVERVIEW.md).
Scope is the publishing CMS as designed. Commerce features are a conditional
Phase 5 that starts only after a business decision.

Four engineering phases are needed: the product's core exists and its API is
well tested, so the work is hardening, correctness gaps, UX resilience, and
operations. A rebuild or new architecture is not justified by any finding.

---

## Phase 1 — Secrets and security hardening

**Objective:** remove every verified path to forged access, credential misuse,
or unauthenticated cache abuse.

- Findings: SEC-0, SEC-1, SEC-2, SEC-3, SEC-4, SEC-5, SEC-6 (newsletter), SEC-7, SEC-10, TD-1, TD-2
- Scope: `apps/api` config, posts preview, CSRF guard, storage providers,
  cache invalidation; both site `api/revalidate` handlers; new
  `@multi-site-cms/config/revalidation`; env templates and docs.
- DB changes: none. API changes: preview `siteId` must match the token
  (stricter); webhook contract unified. **Breaking for deploys:** production
  requires `PREVIEW_TOKEN_SECRET`.
- Tests: regression tests for each fixed finding; full gate.
- Acceptance: lint, typecheck, test all pass; no secret literals in source;
  each fix covered by a test that fails on the old code where practical.
- Blocked item: Cloudinary secret rotation (owner action).

## Phase 2 — Core workflow correctness

**Objective:** every backend workflow that claims to work actually works and is
authorized at the object level.

| Item                               | Finding          | Notes                                                                                                                                                                                                                  |
| ---------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wire on-demand revalidation        | FEAT-PUB-3, TD-3 | Needs a per-site base URL. Proposed: derive `https://<primary active domain>` from `site_domains`, with an optional `SITE_REVALIDATE_URLS` env override for local and private networks. ADR needed (touches ADR-0020). |
| Comment abuse controls             | SEC-6, SEC-9     | Rate limit in the travel-blog route handler; moderation default per business decision                                                                                                                                  |
| Object-level authorization sweep   | SEC-8            | Every `PostsService` / `PublicationsService` / `MediaService` method; add a test per method                                                                                                                            |
| Shared site-ID resolver for guards | TD-4             |                                                                                                                                                                                                                        |
| Validated `API_BASE_URL`           | TD-7             | Add to env schema; production must set it                                                                                                                                                                              |
| `post_comments` composite FK       | DB-1             | Reviewed migration, pre-check query, `down()`                                                                                                                                                                          |
| API tests                          | TEST gaps        | comments, newsletter, users/roles, audit-logs, settings, analytics                                                                                                                                                     |

- Acceptance: a published change reaches a running site through the webhook
  in an integration test; every new test passes; no cross-site access in the
  sweep.

## Phase 3 — Public site and admin UX resilience

**Objective:** no misleading UI, branded failure states, and browser-verified
critical journeys.

| Item                                                                                  | Finding                     |
| ------------------------------------------------------------------------------------- | --------------------------- |
| `error.tsx`, `not-found.tsx`, `global-error.tsx`, key `loading.tsx` in all three apps | UX-1                        |
| Contact form: implement the chosen option or replace with `mailto:`                   | FEAT-TB-9 / UX-2 (decision) |
| `PopularAirSports` from CMS data (categories or a pinned list)                        | UX-3                        |
| Air Sports `/articles` index                                                          | UX-4                        |
| Browser verification at 1440 / 768 / 375, both themes; keyboard flows                 | UX audit                    |
| `@axe-core/playwright` on critical routes                                             | TEST gaps                   |
| Admin page decomposition, one route per change, starting with `posts/page.tsx`        | UX-6, TD-5                  |

- Acceptance: Playwright journeys (admin login → create → publish; travel
  home → article → comment; air-sports home → event) pass locally with
  screenshots; zero serious axe violations on those routes.

## Phase 4 — Production operations

**Objective:** a release can be deployed, observed, and rolled back with evidence.

- Run Playwright in CI against PostgreSQL + API + sites (replace `test:e2e:list`).
- Two-worker concurrency test for scheduled publishing.
- Decide SSE scaling (single instance documented, or PostgreSQL `LISTEN/NOTIFY` / Redis) — TD-9.
- Retention jobs for `analytics_page_views` and `audit_events`; privacy doc (DB-4, DB-5).
- Backup restore drill on a copy; record timings in `docs/production/backup-and-recovery.md`.
- `pnpm audit` review; update the existing production guides rather than adding new ones.
- Remove empty folders (TD-8).
- Acceptance: green CI including E2E; documented restore drill; final
  readiness audit re-scored with evidence.

## Phase 5 — Commerce (out of scope — business decision 2026-11-04)

Only if the business confirms booking/payments are in scope. It requires new
ADRs (customer identity, commerce domain model, payment provider, PCI scope),
a merchant account, and sandbox credentials. Not estimated until then.

## Phase 6 — Coverage and hardening backlog

**Objective:** close the test gaps and debt carried over from Phases 2–4 (Phase 5
is out of scope).

- API tests for newsletter, users/roles, platform settings; fix what they expose.
- Posts workspace: AlertDialog + notices instead of native dialogs (TD-13),
  accessible actions menu that clears the phone tab bar (TD-15).
- SVG asset sandbox CSP.
- Decide whether platform settings are enforced or shown read-only (SEC-18).
- Then: remaining admin page decompositions (TD-5), native dialogs on other
  screens (TD-13), personal-data erasure (DB-5).

## Phase 7 — Enforced platform settings (owner approved 2026-11-05)

Wire every admin platform setting into the API path it governs (auth, sessions,
passwords, uploads, publishing, retention, maintenance banner), with safe
clamping and fallbacks; remove settings for features that do not exist.

## Phase 9 — Deployment readiness (free tier: Neon, Render, Vercel)

**Objective:** a first production deploy that works end to end, then stays up.

Blockers found while planning:

- SEC-22: admin (Vercel) and API (Render) are different sites, so session and
  CSRF cookies cannot work. Proxy `/api/v1/*` through each frontend origin with
  Next.js rewrites, so the browser only talks to its own origin.
- No production path to create roles and permissions: the development seed
  refuses production. Add an idempotent, production-safe platform bootstrap
  (permissions + roles only; no users, no demo content).
- TD-16: rate limits per IP must see the real client IP through the proxies.

Work:

1. Deployment config: `render.yaml` (API, Node 24, pnpm via corepack, migrations
   before start, health check), Vercel project settings per app (root directory,
   build command, env), documented in `docs/deployment/production-runbook.md`.
2. Neon: pooled connection string with `sslmode=require`; verify TLS and pool
   size against Neon free limits; migrations run on each deploy (idempotent).
3. Same-origin API proxy for admin and both sites; CORS narrowed to the real
   frontend origins; cookie flags verified over HTTPS.
4. Production bootstrap CLI (roles/permissions), then `bootstrap:super-admin`
   and site creation through the admin.
5. Media on Cloudinary (Render's free disk is ephemeral; local storage loses
   files on every deploy).
6. Keep-alive and monitoring: an external monitor (UptimeRobot, free) calling
   `/api/v1/health` every 5 minutes keeps the Render free instance awake and
   alerts on downtime; a GitHub Actions schedule as a backup.
7. Post-deploy smoke test script (health, login, publish, public page, ISR
   revalidation) and a rollback note.
8. UX and production polish: SEO metadata and Open Graph images per site,
   sitemap and robots on real domains, 404/500 pages verified, Lighthouse pass
   (performance, accessibility, SEO) on both sites, cookie/privacy notice for
   analytics, email for password reset (later, needs an email provider).
