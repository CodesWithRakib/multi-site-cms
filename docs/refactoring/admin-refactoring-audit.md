# Admin Dashboard Refactoring & Code Quality Audit

**Date:** 2026-11-01  
**Target:** `apps/admin` (Centralized CMS Dashboard Shell)  
**Authors:** Principal Product Designer, Senior Frontend Architect, Senior Backend Architect, Design Systems Engineer, Accessibility Specialist, Software Quality Engineer

---

## 1. Executive Summary

Phase 09 delivered functional completeness for the multi-site administration dashboard across 15 routes. However, an architectural and visual audit reveals substantial technical debt, inconsistency, and code smells:

1. **Monolithic Page Files**: Multiple pages exceed 400–600 lines, blending API queries, UI layouts, form mutations, custom modal dialogs, and pagination in a single file (e.g., `taxonomy/page.tsx` at 683 lines, `PostForm.tsx` at 642 lines).
2. **Duplicate Component Implementations**: Shell components (`SiteSwitcher.tsx`, `UserMenu.tsx`) manually handle click-outside events and backdrop overlays using raw React hooks (`useRef`, `useEffect`) rather than utilizing Radix UI primitives already in `@multi-site-cms/ui`.
3. **Design System Drift**: Widespread use of arbitrary color classes (e.g., `bg-blue-600`, `text-slate-500`, `border-slate-200`) rather than semantic CSS design tokens (`bg-primary`, `text-muted-foreground`, `border-border`), preventing clean dark mode styling.
4. **Missing or Incomplete UI States**: Several table views lack structured skeleton loading states, empty states lack actionable creation buttons, and error recovery is inconsistent.
5. **Missing Design Reference**: 0 design mockups or visual specification images were found in the repository. Layout refactorings must be grounded in explicit architectural contracts until the design reference is supplied.

---

## 2. Route-by-Route Technical Audit

| Route                  | Primary File                          | Lines | Responsibilities & Observed Code Smells                                                                                                                                                                                                            | Backend API Mapping                                                     |
| ---------------------- | ------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/login`               | `src/app/login/page.tsx`              | 134   | Authenticates user into CMS. Uses custom card/input styling instead of `@multi-site-cms/ui` Form/Input/Card components. Lacks password visibility toggle.                                                                                          | `POST /auth/login` (Session cookie)                                     |
| `/` (Overview)         | `src/app/page.tsx`                    | 338   | Platform overview, site stats, metrics, quick actions, publication feed. High cognitive load; cards have hardcoded slate gradients and arbitrary shadows. Needs decomposition into `<MetricsSummary>`, `<SiteActivityList>`, `<QuickActionsCard>`. | `GET /sites`, `GET /sites/:siteId/publications`, `GET /system/health`   |
| `/posts`               | `src/app/posts/page.tsx`              | 498   | Content list with status filters, search, pagination, bulk operations. High cyclomatic complexity. Mixes table rendering, pagination state, and mutation triggers.                                                                                 | `GET /sites/:siteId/publications`                                       |
| `/posts/new`           | `src/app/posts/new/page.tsx`          | 42    | Wrapper initializing empty draft post. Thin wrapper around `PostForm.tsx`.                                                                                                                                                                         | N/A (Delegates to `PostForm`)                                           |
| `/posts/[id]`          | `src/app/posts/[id]/page.tsx`         | 68    | Edit view for specific publication draft. Wrapper around `PostForm.tsx`.                                                                                                                                                                           | `GET /sites/:siteId/publications/:id`                                   |
| `PostForm` (Component) | `src/components/content/PostForm.tsx` | 642   | **Critical Monolith**. Combines metadata fields, rich-text editor mount, slug generator, taxonomy tag pickers, publishing date pickers, autosave timers, and tab controllers in a single file.                                                     | `POST/PATCH /sites/:siteId/publications`, `GET /sites/:siteId/taxonomy` |
| `/media`               | `src/app/media/page.tsx`              | 391   | Media asset browser, dropzone upload, metadata inspect drawer. Combines upload progress tracking with asset grid and deletion confirmation.                                                                                                        | `GET /media/assets`, `POST /media/upload`, `DELETE /media/assets/:id`   |
| `/taxonomy`            | `src/app/taxonomy/page.tsx`           | 683   | **Critical Monolith**. Manages site categories and tags in two separate tabs. Contains modal dialog definitions, form schemas, table listings, and inline color pickers in one file.                                                               | `GET/POST/PATCH/DELETE /sites/:siteId/taxonomy/categories`, `.../tags`  |
| `/publishing`          | `src/app/publishing/page.tsx`         | 382   | Publication calendar, queue monitors, scheduled releases. High density, but calendar rendering logic and queue list are intertwined.                                                                                                               | `GET /sites/:siteId/publications/scheduled`, `POST .../publish`         |
| `/sites`               | `src/app/sites/page.tsx`              | 344   | Multi-site registry (Super Admin only). Lists registered sites, domains, themes, and publication statuses. Needs separation into site card and creation dialog.                                                                                    | `GET/POST/PATCH /sites`                                                 |
| `/sites/[id]`          | `src/app/sites/[id]/page.tsx`         | 275   | Site configuration, custom domains, SEO defaults, feature flags.                                                                                                                                                                                   | `GET/PATCH /sites/:id`                                                  |
| `/users`               | `src/app/users/page.tsx`              | 358   | Platform user list, role assignments, site membership modal. Dialog state and user table combined.                                                                                                                                                 | `GET/POST /users`, `POST /users/:id/memberships`                        |
| `/settings`            | `src/app/settings/page.tsx`           | 215   | Platform settings, maintenance mode, caching config, security headers.                                                                                                                                                                             | `GET/PATCH /system/settings`                                            |
| `/audit-logs`          | `src/app/audit-logs/page.tsx`         | 290   | Security audit trail, actor filtering, action event logs, JSON metadata viewer. Table controls need pagination component abstraction.                                                                                                              | `GET /audit-logs`                                                       |
| `/help`                | `src/app/help/page.tsx`               | 178   | Knowledge base, keyboard shortcut cheat sheet, publishing guides. Static content, clean layout.                                                                                                                                                    | Static documentation                                                    |

---

## 3. Core Architectural Deficiencies

### 3.1 Component Layering & File Sizing

- Currently, page files act as view models, controllers, and presentational components simultaneously.
- **Rule**: Every page must follow the **Layered Component Architecture**:
  1. `page.tsx` (< 100 lines): Orchestrates route layout, authorization guard, and top-level view model.
  2. `_components/` (< 200 lines each): Modular presentational and interactive blocks.
  3. `_hooks/` (< 150 lines each): State handling, query params, debounced inputs, and mutations.
  4. `_types/`: Type definitions and form schemas.

### 3.2 Design Token Non-Compliance

- Existing UI relies heavily on Tailwind's default slate/blue color ramps (`text-slate-900`, `bg-blue-600`).
- This breaks dark mode elegance and creates low-contrast borders (`border-slate-200` vs `border-border`).
- **Rule**: All elements must strictly consume `@multi-site-cms/ui` semantic CSS variables: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`.

### 3.3 Overlays & Accessibility Failures

- `Header.tsx`, `SiteSwitcher.tsx`, and `UserMenu.tsx` handle dropdown menus by manually managing open boolean states and `document.addEventListener('mousedown')`.
- This violates WCAG accessibility:
  - No keyboard arrow key navigation between menu items.
  - No automatic focus trapping.
  - No `aria-expanded` and `aria-haspopup` compliance.
- **Rule**: All dropdowns, dialogs, tooltips, and drawers must use Radix UI primitives exported from `@multi-site-cms/ui`.

---

## 4. Incomplete Features & Backend Mapping

1. **Category Hierarchy**:
   - The backend supports `parentId` on categories, but the UI renders a flat list without visual nesting or parent selector validation.
2. **Scheduled Publishing Calendar**:
   - Calendar date clicks do not navigate directly into pre-filled scheduled publication forms.
3. **Audit Log JSON Payload Inspector**:
   - Formatted JSON payloads are displayed in un-styled pre blocks rather than an accessible syntax-highlighted inspector.
4. **Site Switcher Workspace Scoping**:
   - When switching sites in the header, certain active routes (like taxonomy or media) do not reset their query pagination cursor, causing potential 404s on mismatched offsets.

---

## 5. Refactoring Plan & Phasing

- **Phase 13 (Current)**: Foundation only. Design token unification, shared component audit, Project Skills definition, Visual QA pipeline, Seed data strategy, and ADR 0025.
- **Phase 14 (Next)**: Authentication & Shell refactoring (`/login`, `ShellLayout`, `Header`, `Sidebar`, `SiteSwitcher`, `UserMenu`).
- **Phase 15**: Dashboard Overview (`/`) refactoring with modular metric widgets and real API data.
- **Phase 16**: Content Workspace & Post List (`/posts`) refactoring.
- **Phase 17**: Editorial Studio & Post Editor (`PostForm.tsx`) modularization.
- **Phase 18**: Taxonomy & Media management refactoring (`/taxonomy`, `/media`).
- **Phase 19**: Publishing & Scheduling engine UI refactoring (`/publishing`).
- **Phase 20**: Multi-Site Administration, User Management & Audit Trail (`/sites`, `/users`, `/settings`, `/audit-logs`).
