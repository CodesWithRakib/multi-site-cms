# Testing strategy

## Levels and tools

| Level             | Runner           | Location                                                   | Scope                                    |
| ----------------- | ---------------- | ---------------------------------------------------------- | ---------------------------------------- |
| Package unit      | Vitest           | `packages/*/src/**/*.test.ts(x)`                           | Pure logic, parsing, transport, reducers |
| API behavior      | Jest + supertest | `apps/api/src/**/*.spec.ts`, `apps/api/test/*.e2e-spec.ts` | Envelopes, validation, errors, guards    |
| Cross-application | Playwright       | `e2e/*.spec.ts`                                            | Smoke paths across real servers          |

Two runners is a deliberate choice: Vitest serves ESM packages and React, Jest
serves Nest's decorator/`reflect-metadata` toolchain. Do not add a third or convert
one without an ADR.

## Commands

```bash
pnpm test                    # Vitest + Jest through Turborepo
pnpm --filter @multi-site-cms/api test
pnpm --filter @multi-site-cms/api test:watch
pnpm --filter @multi-site-cms/api test:cov
TEST_DATABASE_URL=… pnpm --filter @multi-site-cms/api test:integration
pnpm --filter @multi-site-cms/ui test
pnpm test:e2e:list           # discovery only, no browsers, no servers
pnpm test:e2e                # full smoke suite
```

`pnpm test:e2e` starts the API and all three web applications via
`playwright.config.ts` `webServer`, unless a matching server is already running
(or `CI` is set). Install browsers once: `pnpm exec playwright install chromium`.

## What must be tested

1. **Behavior, not implementation.** Assert response bodies, rendered accessible
   text, and returned values.
2. **Boundaries.** Validation failure, unknown fields, not found, unauthorized,
   forbidden, and cross-tenant access.
3. **Contract.** The API envelope shape and error codes are contract tests; a
   change to them is a breaking change.
4. **Determinism.** Inject time and randomness; never `sleep`.
5. **Security paths** get a deny test, not only an allow test.

Coverage that exists: the envelope and correlation on `/health`, unknown-route error
envelope, `api-client` timeout/error normalization, `validation` and `config`
parsing, the Redux platform API, the `Button` primitive, and the browser smoke suite
for the three web applications. Phase 03 adds configuration rules, locale
negotiation, catalog completeness, error-code mapping, validation field details,
payload limits, safe 500s, OpenAPI generation and docs routes, database wiring, and
readiness against both a live and an unreachable PostgreSQL.

## What does not need a test

- Styling-only changes and copy edits.
- Framework configuration that a build already exercises.
- Trivial getters and type-only modules.

There is no coverage percentage target. A high number with untested denial paths
is worse than a lower number that covers the contract.

## E2E discipline

- Keep the suite to smoke coverage per application: it renders, it reaches the
  API, headers are present.
- Do not encode feature matrices in E2E; those belong in API behavior tests.
- Use the configured base URLs (`E2E_*_URL`) rather than hardcoded ports.
- Supplement Phase 02 flows with one journey per critical path (publish, schedule,
  upload), no more.
- A flaky test is a defect. Fix the cause; retries exist for CI infrastructure
  noise only (`retries: 2` under `CI`).

## Database testing (Phase 02)

- Integration tests use a disposable PostgreSQL instance from
  `infrastructure/docker`, never a shared environment.
- Each test creates its own tenant-scoped fixtures and asserts isolation between
  two sites on every tenant-scoped query.
- Migrations are exercised in CI against an empty database before they are trusted.

## Reporting

When a check cannot run (no Docker, browsers not installed, no database), report
that explicitly. Never present an unexecuted suite as passing, and never weaken an
assertion to get a green run.
