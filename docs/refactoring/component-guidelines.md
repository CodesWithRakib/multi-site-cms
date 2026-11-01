# Component Architecture & Decomposition Guidelines

**Date:** 2026-11-01  
**Scope:** `@multi-site-cms/ui` and `apps/admin`  
**Standard:** Strict TypeScript, Single Responsibility, Maximum 250 Lines/File

---

## 1. Five-Tier Component Hierarchy

Every component in the CMS must belong to one of five distinct tiers:

```
┌────────────────────────────────────────────────────────┐
│ 5. Page Orchestrator (src/app/**/page.tsx)             │  < 100 lines
├────────────────────────────────────────────────────────┤
│ 4. Feature Components (src/components/feature/*)       │  < 200 lines
├────────────────────────────────────────────────────────┤
│ 3. Shell & Layout Components (src/components/shell/*)  │  < 150 lines
├────────────────────────────────────────────────────────┤
│ 2. Shared Compound Blocks (packages/ui or src/shared)  │  < 150 lines
├────────────────────────────────────────────────────────┤
│ 1. Atomic Primitives (packages/ui/src/components/*)    │  < 100 lines
└────────────────────────────────────────────────────────┘
```

### Tier 1: Atomic Primitives (`@multi-site-cms/ui`)

- Headless Radix UI wrappers styled with Tailwind CSS and `cva`.
- Zero business logic, zero API awareness.
- Examples: `Button`, `Input`, `Label`, `Badge`, `Skeleton`, `Dialog`, `DropdownMenu`, `Tabs`, `Table`.

### Tier 2: Shared Compound Blocks

- Reusable domain-agnostic UI patterns composed from atomic primitives.
- Examples: `DataTableToolbar`, `ConfirmDialog`, `EmptyStateCard`, `ErrorAlert`, `StatCard`.

### Tier 3: Shell & Layout Components

- Application-level scaffolding providing consistent navigation, user state, and site context.
- Examples: `ShellLayout`, `Header`, `Sidebar`, `SiteSwitcher`, `UserMenu`, `ThemeToggle`.

### Tier 4: Feature Components

- Domain-specific components scoped to a specific business domain (posts, taxonomy, users, sites).
- Encapsulate localized sub-state, form schemas, and user interactions.
- Examples: `PostFilterBar`, `PostTable`, `CategoryTree`, `MediaDropzone`, `UserRoleBadge`.

### Tier 5: Page Orchestrators

- Route-level entry points (`page.tsx`) in Next.js App Router.
- Responsible _only_ for:
  1. Triggering top-level RTK queries or reading params.
  2. Guarding authorization (`AuthGuard`).
  3. Setting page title (`<h1>`) and breadcrumbs.
  4. Composing Feature components and handling global layout states.

---

## 2. File Size & Complexity Limits

To permanently eliminate unmaintainable, AI-generated monoliths:

1. **Target File Size**: **150–250 lines maximum**.
2. **Hard Ceiling**: No single `.tsx` file may exceed **300 lines**.
3. **Cyclomatic Complexity**: No component should handle more than 3 distinct pieces of state simultaneously; extract custom hooks (`_hooks/use<Feature>State.ts`).
4. **Single Responsibility**: Never place an editable data table, creation modal, filter bar, and pagination logic in the same file.

---

## 3. Monolith Decomposition Strategies

### Case Study A: Decomposing `PostForm.tsx` (Currently 642 Lines)

The current `PostForm.tsx` bundles title/slug inputs, rich text editor, category/tag pickers, featured image selector, publishing date pickers, autosave timers, and tab controllers.

**Refactoring Plan**:

- `apps/admin/src/components/content/post-form/`:
  - `PostFormOrchestrator.tsx` (110 lines): Main form provider and submit handler.
  - `PostFormHeader.tsx` (80 lines): Title, status badge, publish/save buttons.
  - `PostEditorPane.tsx` (120 lines): Tiptap rich-text editor mount and word counter.
  - `PostSidebarMetadata.tsx` (150 lines): Slug input, excerpt textarea, author select.
  - `PostSidebarTaxonomy.tsx` (140 lines): Category checkboxes and tag picker popover.
  - `PostSidebarMedia.tsx` (110 lines): Featured image preview and media library picker modal.
  - `PostSidebarPublishing.tsx` (130 lines): Scheduling date/time picker and status transitions.
  - `usePostAutosave.ts` (90 lines): Hook managing debounced draft synchronization.

### Case Study B: Decomposing `taxonomy/page.tsx` (Currently 683 Lines)

The current `taxonomy/page.tsx` contains category listings, tag listings, category creation modal, tag creation modal, edit dialogs, delete confirmation, and color pickers.

**Refactoring Plan**:

- `apps/admin/src/app/taxonomy/`:
  - `page.tsx` (70 lines): Tabs orchestrator (`Categories` vs `Tags`).
  - `_components/CategoryList.tsx` (130 lines): Category data table and action menu.
  - `_components/CategoryDialog.tsx` (150 lines): Add/Edit category modal with Zod validation.
  - `_components/TagList.tsx` (120 lines): Tag data table with usage counters.
  - `_components/TagDialog.tsx` (110 lines): Add/Edit tag modal.
  - `_components/TaxonomyDeleteDialog.tsx` (80 lines): Reusable confirmation dialog.
  - `_hooks/useCategoryHierarchy.ts` (75 lines): Calculates indented category trees.

---

## 4. TypeScript Typing & Props Conventions

1. **Explicit Interface Declarations**:
   - Every component must declare an explicit `interface <ComponentName>Props`.
   - Never use inline object types (`export function Button({ label, onClick }: { label: string, onClick: () => void })`).
2. **Strict Event Handlers**:
   - Use typed React synthetic events: `onChange: (e: React.ChangeEvent<HTMLInputElement>) => void`.
3. **No `any` or Silencing Comments**:
   - `any`, `@ts-ignore`, and `@ts-nocheck` are strictly prohibited by our linting rules.
4. **Children Typing**:
   - Use `React.ReactNode` for children props.
