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
