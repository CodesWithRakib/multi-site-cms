# Skill: ui-ux-design-standards

## Purpose

Enforce professional, intentional, accessible, and high-density design standards across the multi-site CMS administration interface. Eliminates generic, AI-generated, visually noisy, or decorative anti-patterns in favor of a cohesive SaaS design system.

## When to use

Use whenever designing, modifying, or reviewing admin dashboard layouts, components, tables, navigation, forms, typography, or interaction patterns.

## Mandatory rules

1. **Information Density over Empty Space**:
   - Provide purposeful whitespace. Avoid giant padded cards with sparse content.
   - Admin dashboards must maximize useful visibility: data tables, metric tiles, status pills, and direct actionable controls.
2. **Centralized CSS OKLCH Design Tokens**:
   - Never use arbitrary Tailwind classes (e.g., `bg-blue-600`, `text-slate-800`, `border-gray-200`) or hardcoded hex colors (`#1e293b`).
   - Use semantic design tokens: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-primary`, `text-primary-foreground`.
   - Support seamless light and dark mode out-of-the-box via CSS variables.
3. **Typography Hierarchy**:
   - Primary UI font: `Plus Jakarta Sans` (sans-serif) for all labels, headings, body, and controls.
   - Editorial font: `Playfair Display` (serif) reserved strictly for editorial publication previews or public sites.
   - Monospace font: `JetBrains Mono` for code blocks, slugs, UUIDs, revision hashes, and API payloads.
   - Follow strict type scale: `text-xs` (11-12px metadata), `text-sm` (13-14px body/tables/forms), `text-base` (15-16px subheadings), `text-lg`/`text-xl` (page section titles), `text-2xl` (page title `h1`).
4. **Structured Form & Action Patterns**:
   - Clear visual distinction between primary, secondary, outline, and destructive actions.
   - Action triggers must indicate state: loading spinner, disabled state during flight, and immediate optimistic or feedback toast.
   - Destructive actions (delete, unpublish, purge cache, revoke role) require an explicit confirmation dialog with warning context.
5. **Complete State Representation**:
   - Every view must deliberately model five discrete states:
     - **Loading**: Skeleton loaders matching exact content layout (no generic whole-page spinner).
     - **Empty**: Contextual icon, informative explanation, and primary call-to-action button.
     - **Error**: Descriptive error message with retry button and correlation ID/status.
     - **Unauthorized**: Clean 403 banner explaining missing role or site permission.
     - **Success / Data**: Polished responsive presentation.

## Workflow

1. Review requirements against user persona (Super Admin vs. Site Admin).
2. Establish layout hierarchy: Page header (`h1`, breadcrumbs, primary actions) -> Metric summary cards / Filters -> Content body (tables, forms, cards).
3. Verify contrast ratios using WCAG AAA/AA token definitions.
4. Implement component states (Skeleton, Empty, Error, Content).
5. Verify responsive layouts from 375px mobile through 1440px desktop.

## Anti-patterns

- Arbitrary color classes like `bg-indigo-500` or raw hex strings.
- Monolithic pages exceeding 300 lines with multiple concerns mixed together.
- Generic placeholders with no contextual retry or creation buttons.
- Giant cards with single words and massive empty margins.
- Inconsistent icon styles, sizes, or misaligned icon-to-text baselines.

## Review checklist

- [ ] All colors derive from semantic theme tokens.
- [ ] Typography adheres to `Plus Jakarta Sans` hierarchy.
- [ ] Loading skeleton, empty, and error states exist.
- [ ] Responsive layout tested on 375px, 768px, 1024px, and 1440px.
- [ ] Dark mode renders correctly with proper contrast.
