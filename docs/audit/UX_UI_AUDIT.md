# UX / UI Audit

Scope: source inspection only. **No browser session was run**, so visual,
responsive, keyboard, and contrast checks are pending (Phase 3). Standards:
`.agent/skills/ui-ux-design-standards`, `accessibility-wcag`, `visual-qa-testing`.

## Findings from code

| ID   | Severity                   | App         | Finding                                                                                                                                                                                                                                                               |
| ---- | -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-1 | ~~High~~ Fixed (Phase 3)   | all         | `not-found.tsx`, `error.tsx`, `global-error.tsx` in all three apps via the shared `StatusPage` (admin copy bilingual). No `loading.tsx` on detail routes on purpose: streaming made unknown slugs return HTTP 200 (soft 404); an E2E test guards this.                |
| UX-2 | High                       | travel-blog | `/contact` shows "sent" after submit but nothing is sent or stored. This misleads visitors.                                                                                                                                                                           |
| UX-3 | ~~Medium~~ Fixed (Phase 3) | air-sports  | `PopularAirSports` now shows the most-covered CMS categories with real dispatch counts. Removed invented ratings, review counts, durations, badges, and a non-persistent "favorite" button. Images remain decorative per known slug (categories have no image field). |
| UX-4 | ~~Medium~~ Fixed (Phase 3) | air-sports  | `/articles` index with validated `?page=` pagination, header link, and sitemap entry.                                                                                                                                                                                 |
| UX-5 | Medium                     | travel-blog | `/destinations` is the latest 24 articles under a "destination guides" heading; there is no destination model, filter, or region grouping.                                                                                                                            |
| UX-6 | Low                        | admin       | Large page components (`posts/page.tsx` 901 lines, `sites/[siteId]/page.tsx` 702, `users/[userId]/page.tsx` 575, `sites/page.tsx` 566) exceed the 150–250 line guideline in `refactoring-standards`; harder to keep loading/empty/error states consistent.            |
| UX-7 | Low                        | admin       | Inline English fallbacks after translation lookups (e.g. `t.sites.searchPlaceholder` with a hardcoded default in `src/app/sites/page.tsx`) suggest missing i18n keys.                                                                                                 |

## Pending verification (Phase 3)

- Viewports 1440 / 768 / 375 for every public route and main admin screens.
- Keyboard-only flows: login, post editing, publishing modal, media upload.
- Focus management in dialogs; contrast in both themes.
- Loading, empty, and error states for each RTK Query screen.

## Found during Phase 3

| ID    | Severity         | App                     | Finding                                                                                                                                                                                                                                                                  |
| ----- | ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UX-8  | **High** — Fixed | admin                   | The admin production build failed at HEAD: `/taxonomy` used `useSearchParams()` without a Suspense boundary, so prerendering aborted. Wrapped in `<Suspense>` like `/login`. The earlier readiness report claimed all apps built.                                        |
| UX-9  | High — Fixed     | ui                      | `toggle-group.tsx` called `createContext` at module scope without `'use client'`; any Server Component importing `@multi-site-cms/ui` crashed in dev (every route 500). Found by the first real E2E run.                                                                 |
| UX-10 | High — Fixed     | travel-blog, air-sports | At 375 px both sites scrolled sideways (70 px and 12 px). `PillButton` concatenated class strings, so the caller's `hidden sm:inline-flex` on Subscribe lost to its own `inline-flex`. Now merged with `cn()` (tailwind-merge). E2E overflow test fails on the old code. |

## Browser verification (Phase 3)

Playwright, Chromium, against local dev servers with the dev database:
404 pages at 1440 / 768 / 375 on both sites (screenshots reviewed), unknown
article slugs return HTTP 404, no horizontal overflow at 375 px on either home
page, admin unknown route shows no framework page. Not yet covered: dark theme,
keyboard-only flows, axe accessibility scan, admin screens beyond login.

## Found and fixed in Phase 3b (theme and mobile)

| ID    | Severity | App         | Finding and fix                                                                                                                                                                                                                                                                                      |
| ----- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-11 | High     | all         | Dark mode never followed the OS: every theme provider defaulted to `light`, and reading storage during render caused hydration mismatches. One shared provider now defaults to `system` and applies the theme before paint (`next/script` `beforeInteractive`). E2E: "follows the system dark mode". |
| UX-12 | High     | all         | No central theme: ~6,000 hard-coded palette classes and 114 raw hex classes; Air Sports' main buttons were green while its brand is blue. Fixed by ADR-0027 (one `site-themes.ts`, derived tokens, palette aliasing, hex codemod in admin).                                                          |
| UX-13 | High     | travel-blog | `/categories` nested a link inside a link (`CategoryBadge` inside the card) → full hydration failure. `CategoryBadge` gained `linked={false}`. E2E: "main routes render without console errors".                                                                                                     |
| UX-14 | Medium   | travel-blog | Hero showed invented "100+ Destinations, 500K+ Travelers, 4.9 User Rating". Replaced with real published-story and topic counts from the CMS.                                                                                                                                                        |
| UX-15 | Medium   | air-sports  | Search field used a fixed dark background (`bg-neutral-900/60`): dark text on dark field in light mode. Now `bg-muted/60`.                                                                                                                                                                           |
| UX-16 | High     | all         | No mobile app experience: no bottom navigation, no manifest or icons, no safe-area handling. Added `MobileTabBar`, web app manifest (standalone), generated icons, `appleWebApp`, `viewportFit: cover`, touch defaults. E2E: installability, tab bar, desktop hiding.                                |

Visual review: 60 screenshots before, 60 after (all public routes plus admin
login, 1440 px and 390 px, light and dark), compared as contact sheets.

## Found and fixed in Phase 3c (authenticated admin review)

Reviewed with local Super Admin and Travel site-admin accounts: 13 admin
routes × 1440/390 px × light/dark, plus the site-admin view.

| ID    | Severity | Finding and fix                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-17 | **High** | Dashboard numbers were invented while labelled "real": _Total Views_ = published posts × 128.4 shown as "2440K" with a fixed "+18.7%"; _Total Authors_ = published × 1.5; every card defaulted to a "+12.5%" trend and drew the same rising sparkline. Now: real page views and growth from the analytics API (same site and period), Published with drafts/scheduled subtext, trend badges only for real comparisons, no fake sparklines. Unit and E2E regression tests. |
| UX-18 | Medium   | Sidebar "Upgrade to Pro / View Plans" card with a button that did nothing; the product has no plans. Removed with its translations.                                                                                                                                                                                                                                                                                                                                       |
| UX-19 | Medium   | Sidebar was not permission-aware: site admins saw Websites, Users, and Settings, which led to 403 pages or (Settings) an editable form filled with defaults. The API already returned 403. Sidebar now filters by role/permission; `/settings` requires `platform:configure`. E2E (`admin-roles.spec.ts`).                                                                                                                                                                |
| UX-20 | Medium   | Admin on phones: stat cards stacked one per row (long scroll before content) and navigation only through the drawer. Stat grids are two columns on phones; added a bottom tab bar (Home, Posts, Calendar, Comments, Media) limited to sections every role can open.                                                                                                                                                                                                       |

## Phase 3d — accessibility (WCAG 2.2 AA) and keyboard

Measured with axe-core (`e2e/accessibility.spec.ts`) on 11 public and 8 admin
routes in light and dark mode. First scan: about 80 serious/critical findings.
Now: **0 serious/critical** in all four combinations (E2E-enforced).

| ID    | Finding                                                                                                                                                                | Fix                                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-21 | Brand 600 step (= `--primary`) had 3.6:1 on white, for brand text and white-on-brand buttons; inherited from Tailwind's ramp                                           | Brand ramp 500–900 darkened centrally (600: 4.8–5.2:1 for every site); unit tests fail if a future theme change drops below 4.5:1              |
| UX-22 | Secondary text (`slate-400/500`) below 4.5:1, light and dark                                                                                                           | Neutral 500 darkened centrally; light-only `text-slate-400` → `500`; class strings without a dark variant got one (codemod, 224 + 165 strings) |
| UX-23 | 10 admin dropdowns and the editor had no accessible name; logo links and the language button had names that did not contain their visible text                         | `aria-label`s; logo `aria-label` removed so the visible text is the name                                                                       |
| UX-24 | No skip link anywhere; menu buttons without `aria-expanded`; 8 focusable elements hid the focus outline with no replacement; admin drawer ignored Escape               | Shared `SkipLink`; `aria-expanded`/`aria-controls`; visible focus rings; Escape closes the drawer. E2E: `keyboard.spec.ts`                     |
| UX-25 | Posts list showed "Rakib Islam" as author of every post, a fake "+total" trend and sparklines, and live links to `/<slug>` (404) or an invented `<key>.yourdomain.com` | Real author from the API, honest cards, `/articles/<slug>` or no link                                                                          |
