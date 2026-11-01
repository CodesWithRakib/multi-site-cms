---
name: testing-quality
description: Design and execute unit tests in Vitest, integration tests in Jest with supertest, and end-to-end user journeys in Playwright.
---

# Skill: testing-quality

## Purpose

Prove behavior at the cheapest level that can actually fail, and keep the suite
fast enough that people run it.

## When to use

Any behavior change. Load it when deciding what to test, where a test belongs,
or why a suite is slow or flaky.

## Mandatory rules

1. **Test behavior, not implementation.** Assert on outputs, HTTP responses, and
   rendered accessible text — not on private methods or internal call order.
2. **Right level per concern.** Pure logic and package contracts in Vitest; API
   request/response behavior in Jest with `supertest`; cross-application journeys
   in Playwright.
3. **Boundaries are mandatory tests.** Validation failures, unauthorized and
   forbidden access, cross-tenant access, and not-found paths are the tests most
   likely to catch a real defect.
4. **Deterministic.** No reliance on wall-clock time, network, or ordering.
   Inject or fake time; use fixed fixtures.
5. **Isolation.** No shared mutable state between tests; each test creates what
   it needs and cleans up.
6. **E2E stays shallow.** Playwright covers the smoke path per application, not
   every feature. It starts real servers and is the slowest, flakiest signal.
7. **Fix the cause.** A failing test is either a bug or a wrong assertion. Never
   skip, `.only`, retry-until-green, or weaken an assertion to pass.
8. **Report honestly.** If a suite could not run (missing Docker, no browser),
   say so; do not present it as passing.

## Workflow

1. State the behavior in one sentence: given / when / then.
2. Choose the lowest level that can observe that behavior.
3. Write the failing case first where practical.
4. Cover the happy path plus at least one boundary and one denial.
5. Run only the affected suite while iterating, then the workspace suite.
6. Re-run after the last edit; earlier green runs do not cover later changes.

## Anti-patterns

- Snapshot tests standing in for real assertions on critical markup.
- Testing that a mock was called instead of what the system produced.
- One giant E2E test covering ten features.
- `sleep()` instead of awaiting a visible condition.
- Shared database state between tests with no reset.
- Coverage targets pursued by testing getters.
- Marking a test `skip` to land a feature.

## Review checklist

- [ ] New behavior has a test at the appropriate level.
- [ ] Denial and validation paths covered.
- [ ] Test names read as behavior statements.
- [ ] No time, network, or ordering dependency.
- [ ] Suite passes from a clean state.
- [ ] Playwright still lists and runs if a tested page changed.

## Project references

- `docs/development/testing.md`
- `apps/api/test/health.e2e-spec.ts`
- `packages/*/vitest.config.ts`
- `e2e/platform.spec.ts`
- `playwright.config.ts`
