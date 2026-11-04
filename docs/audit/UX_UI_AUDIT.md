# UX / UI Audit

Scope: source inspection only. **No browser session was run**, so visual,
responsive, keyboard, and contrast checks are pending (Phase 3). Standards:
`.agent/skills/ui-ux-design-standards`, `accessibility-wcag`, `visual-qa-testing`.

## Findings from code

| ID   | Severity | App         | Finding                                                                                                                                                                                                                                                    |
| ---- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-1 | High     | all         | No `error.tsx`, `not-found.tsx`, `global-error.tsx`, or `loading.tsx` anywhere. Failures show the framework default page with no site branding or navigation; slow server renders show no feedback.                                                        |
| UX-2 | High     | travel-blog | `/contact` shows "sent" after submit but nothing is sent or stored. This misleads visitors.                                                                                                                                                                |
| UX-3 | Medium   | air-sports  | `components/home/PopularAirSports.tsx` renders hardcoded cards with fixed Cloudinary image URLs instead of CMS data; editors cannot change them.                                                                                                           |
| UX-4 | Medium   | air-sports  | Articles have detail pages but no `/articles` index route.                                                                                                                                                                                                 |
| UX-5 | Medium   | travel-blog | `/destinations` is the latest 24 articles under a "destination guides" heading; there is no destination model, filter, or region grouping.                                                                                                                 |
| UX-6 | Low      | admin       | Large page components (`posts/page.tsx` 901 lines, `sites/[siteId]/page.tsx` 702, `users/[userId]/page.tsx` 575, `sites/page.tsx` 566) exceed the 150–250 line guideline in `refactoring-standards`; harder to keep loading/empty/error states consistent. |
| UX-7 | Low      | admin       | Inline English fallbacks after translation lookups (e.g. `t.sites.searchPlaceholder` with a hardcoded default in `src/app/sites/page.tsx`) suggest missing i18n keys.                                                                                      |

## Pending verification (Phase 3)

- Viewports 1440 / 768 / 375 for every public route and main admin screens.
- Keyboard-only flows: login, post editing, publishing modal, media upload.
- Focus management in dialogs; contrast in both themes.
- Loading, empty, and error states for each RTK Query screen.
