---
name: refactoring-standards
description: Enforce strict discipline for route-by-route refactoring, incremental test-backed changes, and 150-250 lines max per file.
---

# Skill: refactoring-standards

## Purpose

Enforce strict engineering discipline for refactoring existing routes, components, and backend modules. Ensures refactoring is incremental, safe, test-backed, and adheres to file-size constraints without regression.

## When to use

Use for any refactoring work across `apps/admin`, `apps/api`, or shared packages, particularly when decomposing monolithic components or untangling technical debt.

## Mandatory rules

1. **File Size Target (150–250 lines max)**:
   - Target 150–250 lines per file. Any file approaching or exceeding 300 lines must be split into dedicated subcomponents, hooks, or utility files.
   - Separate concerns into clean component directories:
     - `components/` (feature-specific subcomponents, e.g., `PostTable.tsx`, `PostFilterBar.tsx`, `PostStatusBadge.tsx`).
     - `hooks/` (custom hooks for query state, table sorting, debounced search).
     - `types/` (scoped TypeScript interfaces and view models).
2. **One Route At a Time**:
   - Never perform mass refactoring across multiple routes simultaneously.
   - Refactor one route completely: structure, components, RTK query integration, tests, and visual QA, before touching the next.
3. **Strict TypeScript (No Shortcuts)**:
   - No `any`, no non-null assertions (`!`), no `@ts-ignore` or `@ts-nocheck`.
   - Every API response must use typed generic envelopes (`ApiResponse<T>`).
4. **Behavioral Parity & Zero Regression**:
   - Existing valid user flows, permissions, API calls, and validation rules must continue to function.
   - Run typecheck, lint, unit tests, and Playwright E2E tests before and after refactoring.
5. **No Invented or Incomplete Features**:
   - Do not add fake dummy buttons, non-functional modals, or un-backed controls.
   - If an API does not exist for a desired control, either create the minimal approved backend endpoint or omit the control until scheduled.

## Workflow

1. Read the existing component and list all subcomponents, states, API queries, and interactions.
2. Create directory structure for the route: `_components/`, `_hooks/`.
3. Extract presentational subcomponents into small, single-responsibility files (< 200 lines).
4. Extract complex state or custom hook logic.
5. Replace monolithic file with a clean orchestrator component (< 100 lines).
6. Verify typecheck (`pnpm --filter <app> typecheck`), linting, and automated tests.
7. Conduct visual QA across viewports.

## Anti-patterns

- Refactoring multiple routes in a single turn.
- Combining table rendering, modal dialog forms, pagination, and filter logic in a single 600+ line `page.tsx`.
- Renaming API parameters or changing contracts without backend coordination.
- Leaving `TODO` comments or stubbed functions in refactored code.

## Review checklist

- [ ] Route orchestrator page is concise (< 150 lines).
- [ ] Subcomponents are organized and individually under 250 lines.
- [ ] Strict TypeScript with zero `any` or `@ts-ignore`.
- [ ] Typecheck, lint, and tests pass without errors.
