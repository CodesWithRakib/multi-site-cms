# Test Coverage Audit

Coverage percentages were **not measured** (`test:cov` was not run). Counts
below are from actual runs in this session.

## Results

| Workspace                | Runner                              | Baseline (before changes)                    | After Phase 1 changes                                                                                                   |
| ------------------------ | ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/api`               | Jest + supertest (needs PostgreSQL) | 22 suites, **4 failed** / 211 passed         | 22 suites, **221 passed**, 0 failed                                                                                     |
| `packages/config`        | Vitest                              | 4 passed                                     | 21 passed (+17 revalidation contract)                                                                                   |
| `packages/ui`            | Vitest                              | 16 passed                                    | not re-run separately; passed in full `pnpm test`                                                                       |
| `packages/validation`    | Vitest                              | 12 passed                                    | passed in full run                                                                                                      |
| `packages/api-client`    | Vitest                              | 5 passed                                     | passed in full run                                                                                                      |
| `packages/redux`         | Vitest                              | 3 passed                                     | passed in full run                                                                                                      |
| `apps/admin`             | Vitest                              | 2 files, 11 passed                           | passed in full run                                                                                                      |
| `apps/sites/travel-blog` | Vitest                              | 1 file, 6 passed                             | 6 passed                                                                                                                |
| `apps/sites/air-sports`  | Vitest                              | 2 files, 10 passed                           | 10 passed                                                                                                               |
| `e2e/*.spec.ts`          | Playwright                          | 16 tests; **never run** (CI only lists them) | **42 passed locally** (+ 12 opt-in visual-tour tests); role tests need local accounts via env; still not executed in CI |

Baseline failures: 3 × `media-upload.e2e-spec.ts` (uploads went to a real
Cloudinary account; fixed by pinning local storage in `test/setup-env.ts`),
1 × `openapi.e2e-spec.ts` (stale expected path list; updated with the 14 real
endpoints it was missing).

New regression tests (each confirmed to **fail on the old code** for the
preview cases): SEC-1 forged-with-old-fallback token, SEC-2 cross-site token
minting, SEC-3 site replay, SEC-5 CSRF path bypass, env validation for
secrets and Cloudinary.

## Gaps by risk

| Gap                                                                                                             | Risk   | Phase |
| --------------------------------------------------------------------------------------------------------------- | ------ | ----- |
| E2E tests are never executed in CI (`test:e2e:list` only)                                                       | High   | 4     |
| No API tests for comments (public create, admin moderation), newsletter, audit-logs, analytics, settings, users | High   | 2     |
| Admin app: 11 tests for 20 routes; no component tests for publishing, editor, media                             | Medium | 3     |
| Public sites: 16 tests in total; none for route handlers (`revalidate`, `search`, comments proxy)               | Medium | 2–3   |
| No concurrency test for the scheduled worker with two instances                                                 | Medium | 4     |
| No accessibility automation (`@axe-core/playwright`)                                                            | Medium | 3     |
