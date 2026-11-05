# ADR-0027: Centralized theme and mobile app shell

- Status: Accepted
- Date: 2026-11-04
- Owners: frontend engineering
- Amends: [ADR-0025](0025-ui-ux-engineering-foundation-and-admin-refactoring.md) (token contract)

## Context

Each app defined its own color tokens in `globals.css`, and components used
about 6,000 hard-coded palette classes (`bg-emerald-600`, `text-slate-900`)
plus 114 raw hex classes in the admin. Changing a brand color meant editing
hundreds of files, and the sites were already inconsistent (Air Sports' brand
was blue but its main buttons were green). Dark mode never followed the
operating system: every theme provider defaulted to light. On phones the sites
behaved like desktop pages: no bottom navigation, no install support, a header
that overflowed at 375 px.

## Decision

1. **One source of color.** `packages/ui/src/theme/site-themes.ts` holds four
   numbers per app (brand hue/chroma, neutral hue/chroma). The root `<html>` of
   each app receives them as CSS variables via `siteThemeStyle()`.
2. **Everything derives from those inputs** in `packages/ui/src/theme/theme.css`:
   brand and neutral 50–950 scales, semantic tokens for light and dark mode, and
   `brand-*` utilities.
3. **Legacy palette aliasing.** Brand-like families (`emerald`, `teal`, `sky`,
   `cyan`) map to the brand scale and gray families (`slate`, `gray`, `zinc`,
   `neutral`, `stone`) to the neutral scale, so existing classes follow the
   theme without a 6,000-line rewrite. Status families (red, rose, amber,
   orange, yellow, green, lime, blue, indigo, violet, purple, fuchsia, pink)
   stay fixed so meaning does not change with the brand.
4. **Non-CSS colors** (manifest, `theme-color`, generated icons) come from the
   same inputs through `siteThemeHex()` (OKLCH → sRGB).
5. **One theme provider** (`ThemeProvider`, `useTheme`) in `@multi-site-cms/ui`,
   defaulting to the system preference, with a pre-hydration script
   (`themeInitScript`, rendered by `next/script` `beforeInteractive`) so pages
   never flash the wrong theme.
6. **Mobile app shell**: `MobileTabBar` bottom navigation on phones, a web app
   manifest with icons (`display: standalone`), `appleWebApp` metadata,
   `viewportFit: cover` with safe-area padding, and touch defaults
   (no tap highlight, no double-tap delay, no horizontal overscroll).

## Alternatives considered

- **Codemod all 6,000 classes to semantic tokens now** — highest consistency,
  but a very large, hard-to-review diff with real risk of visual regressions.
  Aliasing gets central control immediately; components migrate gradually.
- **Per-app CSS files with hand-written tokens** (the previous state) — no
  single place to change colors and already drifting.
- **CSS-only theme inputs** — cannot feed the manifest, `theme-color`, or icon
  generation, which need concrete colors.

## Consequences

- To change colors: edit `site-themes.ts` only. A unit test keeps `theme.css`
  in sync with its ramp tables.
- `bg-emerald-*` in a site no longer means emerald; it means "brand". New code
  should use semantic tokens (`bg-primary`) or `brand-*` utilities.
- A raw `<script>` is avoided; the theme script runs through `next/script`.
- Extreme brand chroma can still be gamut-clipped by the browser.
- The brand and neutral ramps are darker than Tailwind's at 500–900 so that
  `--primary` and secondary text meet WCAG AA (4.5:1) for **any** hue; unit
  tests in `site-themes.test.ts` enforce this for every configured site.

## Future migration considerations

Replace aliased palette classes with semantic tokens route by route (tracked
in the roadmap). Once no component uses a brand-like family directly, the
aliases can be removed. Per-site theming from the CMS (editable in the admin)
would move the inputs from `site-themes.ts` to site settings; the CSS layer
would not change.
