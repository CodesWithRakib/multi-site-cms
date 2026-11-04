# Project Overview (audit baseline, 2026-11-04)

## What this product actually is

A **multi-site publishing CMS**: one NestJS API and one admin app manage
canonical posts that are published to independent public sites. Two sites
exist today:

| Site        | App                      | Nature (verified from routes and ADR-0022/0023)                                   |
| ----------- | ------------------------ | --------------------------------------------------------------------------------- |
| Travel Blog | `apps/sites/travel-blog` | Editorial travel articles, destination guides, categories, tags, search, comments |
| Air Sports  | `apps/sites/air-sports`  | Air-sports news, event hubs with live timeline updates over SSE                   |
| Admin CMS   | `apps/admin`             | Content, publications, scheduling, media, taxonomy, sites, users, comments, audit |

## Scope gap against the master directive

The directive lists booking, reservations, availability, checkout, payments,
refunds, customer accounts, packages and operators as audit candidates. **None
of these exist** in code, schema, ADRs, or product docs:

- No booking, order, payment, customer, package, or availability tables in
  `apps/api/src/database/migrations/` (24 tables, all content/identity/ops).
- No customer authentication; only administrator sessions (ADR-0016).
- No payment provider SDK in any `package.json`.
- ADR-0002, 0005, 0022, and 0023 define the sites as publications.

These features are recorded as `MISSING — out of current product scope` in
[FEATURE_INVENTORY.md](FEATURE_INVENTORY.md). Building them would mean a new
product (commerce domain, PCI scope, payment merchant account, customer
identity) and needs a business decision and new ADRs. They are **not** in the
implementation roadmap until that decision is made.

## Stack (verified from package manifests)

- pnpm workspaces + Turborepo; TypeScript 6.0.3 strict
- API: NestJS 12, TypeORM 1.1 with explicit migrations, PostgreSQL 18, Zod 4,
  `@nestjs/throttler`, helmet, Argon2id (`@node-rs/argon2`)
- Web: Next.js 16 App Router, React 19; admin uses Redux Toolkit/RTK Query
- Tests: Jest + supertest (API), Vitest (packages, apps), Playwright (`e2e/`)
- CI: `.github/workflows/ci.yml` — format, lint, typecheck, test, build,
  `test:e2e:list` (E2E tests are listed, **not executed**, in CI)

## Baseline quality gate (before any change in this session)

| Check       | Result                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| `pnpm lint` | pass (10/10 workspaces)                                                 |
| `typecheck` | pass (10/10)                                                            |
| `pnpm test` | **fail** — API 4 failed / 211 passed; all package and app suites passed |

The 4 failures: 3 in `media-upload.e2e-spec.ts` (tests uploaded to a real
Cloudinary account, see SEC-10) and 1 in `openapi.e2e-spec.ts` (expected path
list not updated for 14 endpoints added later).

## Headline findings

1. Committed Cloudinary credentials (SEC-0) and a public preview-signing
   fallback key (SEC-1) — both critical. Fixed in code; rotation pending.
2. On-demand cache revalidation has never worked end to end (FEAT-PUB-3).
3. The contact form shows a success message but sends nothing (FEAT-TB-9).
4. No `error.tsx`, `not-found.tsx`, or `loading.tsx` in any Next.js app (UX-1).
5. The existing [production-readiness-audit.md](../production/production-readiness-audit.md)
   marks every capability "VERIFIED / Low risk"; this audit does not support
   that rating. See [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).
