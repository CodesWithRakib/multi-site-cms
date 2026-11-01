# 25. UI/UX Engineering Foundation & Admin Dashboard Refactoring Strategy

Date: 2026-11-01  
Status: Accepted

---

## Context

The initial 12 implementation phases delivered full functional capabilities for the `multi-site-cms` monorepo. However, an architectural and visual audit of `apps/admin` revealed that the UI suffers from:

1. Inconsistent visual design with arbitrary Tailwind color classes rather than semantic design tokens.
2. Monolithic component files exceeding 600 lines (`taxonomy/page.tsx`, `PostForm.tsx`), violating single-responsibility principles and impeding maintainability.
3. Custom overlay implementations using manual event listeners (`useRef`, `useEffect`) rather than accessible Radix UI primitives.
4. Gaps in state handling across views (loading skeletons, empty states, and error retries).
5. No documented design reference image in the repository.

To transform the centralized Admin Dashboard into a professional, production-grade CMS, we must establish a rigorous engineering foundation before refactoring individual screens.

---

## Decision

1. **Centralized Semantic Token & OKLCH Theme Architecture**:
   - Standardize on semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`) using the OKLCH color space.
   - Enforce persistent Light, Dark, and System theme toggling via `ThemeProvider`.
   - Prohibit arbitrary colors (`bg-blue-600`, `text-slate-800`) or hardcoded hex strings in application code.

2. **Single Shared Component Source (`@multi-site-cms/ui`)**:
   - All interactive primitives (dialogs, dropdown menus, sheets, popovers, tooltips, buttons, tables, badges) must reside in `@multi-site-cms/ui`.
   - Custom backdrop divs and manual click-outside listeners are prohibited; components must use Radix UI primitives with full keyboard and screen-reader accessibility.

3. **Strict Component Sizing & Layering Contract**:
   - Target 150–250 lines per file; hard ceiling of 300 lines.
   - Large views must be decomposed into a 5-tier architecture: Page Orchestrator (< 100 lines), Feature Components (< 200 lines), Shell Components (< 150 lines), Shared Compound Blocks (< 150 lines), and Atomic Primitives (< 100 lines).

4. **Project Skills Integration**:
   - Establish formal skill instructions under `.agent/skills/` (`ui-ux-design-standards`, `shadcn-component-standards`, `accessibility-wcag`, `visual-qa-testing`, `refactoring-standards`) and index them in `AGENTS.md`.

5. **Safe, Incremental Route-by-Route Refactoring**:
   - Refactor routes one at a time with test coverage and multi-viewport visual QA (Desktop 1440px, Tablet 768px, Mobile 375px).
   - Phase 13 serves strictly as foundation and preparation. Phase 14 will initiate route refactoring starting with Authentication and Shell (`/login`, `ShellLayout`, `Header`, `Sidebar`, `SiteSwitcher`, `UserMenu`).

---

## Alternatives Considered

- **Global Re-skinning / Mass Refactoring**: Attempting to rewrite all 15 routes in a single phase. Rejected due to high risk of regressions, broken API bindings, and unmanageable diffs.
- **Third-Party Commercial Admin Templates**: Integrating an external pre-built dashboard theme. Rejected because it introduces unnecessary dependencies, violates our clean monorepo architecture, and fails to integrate with our custom multi-site context.

---

## Consequences

- **Positive**: Consistent, accessible, and maintainable SaaS admin dashboard; strict TypeScript compliance; clean dark mode; robust testability.
- **Negative / Costs**: Decomposing large monoliths requires creating multiple well-scoped subcomponents and updating import paths.
