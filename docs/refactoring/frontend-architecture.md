# Frontend Architecture & Engineering Standards

**Date:** 2026-11-01  
**Target Application:** `apps/admin` (Central Admin Shell)  
**Framework:** Next.js App Router, React 19, Redux Toolkit / RTK Query, Tailwind CSS v4

---

## 1. Next.js App Router Architecture

### 1.1 Server vs. Client Component Boundaries

In `apps/admin`, the administration dashboard requires deep interactive client-side capabilities (rich-text editing, live search filtering, modal overlays, drag-and-drop, Redux store subscriptions).

- The root layout (`src/app/layout.tsx`) is a **Server Component** providing HTML boilerplate, Google Font variables, and metadata.
- Interactive layout wrappers (`Providers`, `ShellLayout`, `Header`, `Sidebar`) and feature components declare `'use client'` at the top.
- The client boundary is kept as specific as possible: layout and feature shells isolate interactive trees, while static SVG assets, icons, and pure utility functions remain strictly functional.

### 1.2 Route Directory Structure

```
apps/admin/src/app/
├── (auth)/
│   └── login/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx              # ShellLayout + AuthGuard mount
│   ├── page.tsx                # Dashboard Overview
│   ├── posts/
│   │   ├── page.tsx            # Posts table & search
│   │   ├── new/page.tsx        # New publication
│   │   └── [id]/page.tsx       # Edit publication
│   ├── media/page.tsx
│   ├── taxonomy/page.tsx
│   ├── publishing/page.tsx
│   ├── sites/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── users/page.tsx
│   ├── settings/page.tsx
│   ├── audit-logs/page.tsx
│   └── help/page.tsx
└── api/
    └── revalidate/route.ts     # Internal ISR revalidation proxy
```

---

## 2. State Management Architecture

### 2.1 Separation of Concerns

1. **Server Cache State (RTK Query)**:
   - All server data (publications, sites, media, taxonomy, users, audit logs) is fetched and managed exclusively via RTK Query (`@multi-site-cms/redux`).
   - Automated cache invalidation via entity tags (`providesTags: ['Post', 'Site', 'Media', 'Taxonomy', 'User']`).
   - Mutation endpoints declare `invalidatesTags` to guarantee instantaneous list updates without manual page refreshes.
2. **Local Client State (Redux Slices & Context)**:
   - `adminContext`: Active site selection (`activeSiteId`), active locale (`locale: 'en' | 'bn'`).
   - `authSlice`: Authenticated user entity, permissions array, session expiry.
   - `themeContext`: Active theme mode (`'light' | 'dark' | 'system'`).
3. **Ephemeral UI State (`useState` / React Hook Form)**:
   - Modals open/closed states.
   - Multi-step form values before submission.
   - Dropdown trigger toggles.

### 2.2 RTK Query Tagging & Cache Policy

- Every collection query provides an array tag list plus an ID-specific tag:
  ```typescript
  providesTags: (result) =>
    result
      ? [
          ...result.data.items.map(({ id }) => ({ type: 'Post' as const, id })),
          { type: 'Post', id: 'LIST' },
        ]
      : [{ type: 'Post', id: 'LIST' }],
  ```
- Any mutation that modifies or deletes a post invalidates `{ type: 'Post', id }` and `{ type: 'Post', id: 'LIST' }`.

---

## 3. Form Management & Validation Standard

All forms across the admin dashboard must adhere to the standardized stack:

1. **React Hook Form**: Handles form state, dirty checking, touched fields, and submit lifecycle without triggering unnecessary re-renders.
2. **Zod Validation Schemas**:
   - Reusable validation schemas imported directly from `@multi-site-cms/validation`.
   - Never define separate, diverging validation rules on the frontend.
3. **Form Component Binding**:
   - Built on shadcn/ui `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`.
   - Accessible error messages automatically associated with form inputs via `aria-describedby`.

---

## 4. Accessibility Architecture (WCAG 2.2 AA)

1. **Semantic HTML & Landmarks**:
   - `<header>`: Top navigation bar, site switcher, user menu.
   - `<aside>`: Collapsible navigation sidebar.
   - `<main>`: Main view canvas, exactly one `<h1>` per route.
2. **Focus Trapping & Overlays**:
   - All modals, drawers, and popovers use Radix UI primitives.
   - Esc closes the overlay. Focus is restored to the triggering element upon close.
3. **Keyboard Shortcuts**:
   - `Ctrl+S` / `Cmd+S`: Save draft in editor.
   - `Ctrl+K` / `Cmd+K`: Quick site/post search command palette.
   - `Escape`: Close active modal or sheet.
