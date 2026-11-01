# Skill: frontend-engineering

## Purpose

Build server-first, accessible, responsive Next.js interfaces where data
fetching, state, and presentation stay separable and each site keeps its own
branding without duplicating the platform.

## When to use

Any change to a page, layout, component, style, or interaction in
`apps/admin`, `apps/sites/*`, or `packages/ui`.

## Mandatory rules

1. **Server Components by default.** Add `'use client'` only for state, effects,
   event handlers, or browser APIs. Push the boundary down to the smallest leaf.
2. **No business logic in page components.** Pages compose data and layout;
   rules live in services (API) or explicit feature modules.
3. **Shared primitives in `packages/ui`.** Site-specific composition stays in the
   application. Do not fork a primitive to change one style — pass tokens or
   variants.
4. **Tokens, not magic values.** Colors, spacing, and typography come from the
   CSS token contract so both sites can diverge deliberately and stay
   consistent internally.
5. **Accessible by construction.** Semantic landmarks, one `h1` per page, labeled
   controls, visible focus, and sufficient contrast. Do not remove focus outlines.
6. **Every state is designed.** Loading, empty, error, and unauthorized states,
   not just the happy path.
7. **Site identity comes from configuration.** `siteConfig` in
   `apps/sites/<site>/src/config/site.ts` is the code-side bridge to the future
   `sites` row. Never hardcode a hostname or infer a tenant from a query string.
8. **Metadata is explicit.** Titles, descriptions, canonical URLs, and `robots`
   are set intentionally per route. Admin ships `robots: noindex`.

## Workflow

1. Identify the owning application and whether the work is shared or site-specific.
2. Check `packages/ui` for an existing primitive or token.
3. Decide server vs client per leaf component, not per page.
4. Build the layout with semantic landmarks; add states before styling polish.
5. Set metadata for the route.
6. Verify responsive behavior at narrow and wide widths.
7. Run the workspace `typecheck` and `lint`, plus the Playwright smoke test if
   you changed a tested page.

## Anti-patterns

- `'use client'` at the top of a page to make one button interactive.
- Copy-pasting a component between the two public sites.
- Fixed pixel widths and hardcoded hex colors instead of tokens.
- `div` with an `onClick` instead of `button`.
- Fetching the same resource in a layout and its child page.
- Reading `window.location.hostname` to decide branding.
- Shipping a client store to a public site that only needs server rendering.

## Review checklist

- [ ] Client boundary is minimal and justified.
- [ ] Semantics and keyboard access are correct; one `h1`.
- [ ] Loading, empty, and error states exist.
- [ ] Tokens used; no inline magic values.
- [ ] Metadata and canonical/robots configured.
- [ ] Works at 360px and desktop widths.
- [ ] `pnpm --filter <app> typecheck` and `lint` pass.

## Project references

- `docs/architecture/overview.md`
- `packages/ui/src/styles.css`
- `packages/ui/src/components/`
- `apps/sites/travel-blog/src/config/site.ts`
- `apps/admin/src/app/layout.tsx`
