---
name: shadcn-component-standards
description: Enforce encapsulation and reuse of @multi-site-cms/ui design primitives built with Radix UI, Tailwind CSS, and CVA variants.
---

# Skill: shadcn-component-standards

## Purpose

Enforce strict encapsulation and reuse of the `@multi-site-cms/ui` design system primitives based on Radix UI and Tailwind CSS. Prevent duplicate UI component creation, hand-crafted un-accessible overlays, or ad-hoc styling hacks.

## When to use

Any time building, refactoring, or integrating UI elements in `apps/admin` or `packages/ui`, including buttons, dialogs, dropdowns, forms, tables, badges, sheets, and popovers.

## Mandatory rules

1. **Source of Truth is `packages/ui`**:
   - All Radix-based primitives live in `packages/ui/src/components/*` and are exported via `packages/ui/src/index.ts`.
   - Never create local duplicate component files (e.g., `apps/admin/src/components/ui/button.tsx`). Import directly from `@multi-site-cms/ui`.
2. **Accessible Primitives**:
   - Every interactive overlay (modal, popover, dropdown, tooltip, sheet) must use its corresponding Radix primitive from `@multi-site-cms/ui`.
   - Never implement manual click-outside listeners, manual focus traps, or custom ESC-key handlers using raw `useEffect`/`useRef`.
3. **Compound Component API**:
   - Retain standard Radix/shadcn compound structure:
     `Dialog` > `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.
   - Preserve `asChild` composition pattern via `@radix-ui/react-slot`.
4. **Style Variance via `class-variance-authority` (cva)**:
   - Component variants (e.g., `variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`, `size="sm" | "default" | "lg"`) must be declared using `cva`.
   - Custom utility combinations must use `cn()` from `@multi-site-cms/ui`.
5. **No Style Leaks or Inline CSS**:
   - No `style={{ ... }}` objects for theme colors or spacing.
   - Use Tailwind CSS classes composed with semantic tokens.

## Workflow

1. Inspect `packages/ui/src/index.ts` to locate the required primitive.
2. If a primitive does not exist in `packages/ui`, implement it within `packages/ui/src/components/<name>.tsx`, export it in `packages/ui/src/index.ts`, and run `pnpm --filter @multi-site-cms/ui build`.
3. Import the primitive into the consuming application (`apps/admin`).
4. Validate keyboard accessibility (Tab, Enter, Escape, Arrow navigation).
5. Verify dark and light theme appearance.

## Anti-patterns

- Manually implementing custom backdrop divs with `fixed inset-0 bg-black/50` instead of `Dialog` or `Sheet`.
- Manually implementing custom dropdown menus with absolute divs and state flags.
- Silencing TypeScript errors with `any` or `@ts-ignore` on component props.
- Creating ad-hoc component libraries within feature directories.

## Review checklist

- [ ] Primitive imported from `@multi-site-cms/ui`.
- [ ] No duplicate component implementation in application package.
- [ ] Accessible keyboard navigation works out-of-the-box.
- [ ] Props follow TypeScript contract with explicit types.
