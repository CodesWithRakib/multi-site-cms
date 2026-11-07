# Travel Blog illustrations and list layout

## Illustrations

All artwork is inline SVG in `src/components/illustrations/`. No bitmaps, no
network requests, no new dependency.

| Component          | Use                                                                             |
| ------------------ | ------------------------------------------------------------------------------- |
| `ScenicArt`        | Landscape (`mountains`, `coast`, `forest`) behind page headers and topic tiles. |
| `EmptyStateArt`    | Spot art for `lost` (404/error), `no-stories`, `no-results`, `mail`.            |
| `StoryPlaceholder` | Stands in for a story with no cover photo; the scene is picked from the slug.   |

Rules:

- Colors come from the theme (`text-primary`, `fill-foreground/10`), so the art
  follows light/dark and any brand palette. Do not hardcode brand colors.
- Always decorative: `aria-hidden`, never the only carrier of meaning. The title
  and text next to it state the situation.
- A missing photo is never replaced with a stock image that could misrepresent
  the place; an illustrated placeholder is used instead.
- `sceneFor(seed)` is deterministic, so a page keeps the same artwork between
  renders and deploys.

## Shared page pieces

- `PageHeader` (`components/ui`): compact illustrated header used by Stories,
  Topics, Tags, Destinations, category and tag archives, and About. It is kept
  short on purpose so the first stories are visible without scrolling.
- `EmptyState` (`components/ui`): illustrated "nothing here" block that always
  offers a next step (a link or button).
- `StatusPage` (`@multi-site-cms/ui`) takes an optional `illustration` slot; the
  404 and route error pages use it.

## Story lists

`ArticleCard` is the one list card. On phones it is a compact row (thumbnail
beside category, title and date) so many stories fit on screen; from `sm` it is
a card with cover, excerpt, author and a "Read story" cue. The whole card is a
single link (the title's stretched link), with the topic badge lifted above it.

The Tags index lists only tags that are on published stories, matching the
sitemap rule that empty taxonomy pages are not surfaced.

## Touch targets

`touch-target` (shared in `@multi-site-cms/ui/styles.css`) grows a small link's
tap area to about 44px without changing layout. Breadcrumb links get it
automatically. Use real padding (`py-2.5`, `min-h-10`) for stacked lists such as
footer links, where an invisible overlay would overlap its neighbours.
