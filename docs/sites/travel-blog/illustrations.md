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

## Landing page

Built in `app/page.tsx` from one fetch of the newest 50 stories plus the
categories and site config; `lib/home-feed.ts` assigns stories to slots.

| Section              | Content                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| Hero                 | Newest stories with a cover image (carousel).                                        |
| Latest stories       | Two large stories on the left, four compact rows on the right; stacks on phones.     |
| Explore by topic     | Busiest categories (up to 8) with a cover photo from their newest story.             |
| In the spotlight     | One story with a large cover and its excerpt.                                        |
| Destination guides   | Swipeable rail of `travel_guide` stories (may repeat a story shown elsewhere).       |
| Places in pictures   | Photo bento on desktop, swipe strip on phones; tiles reveal on scroll.               |
| More stories         | Up to nine further stories, then "Browse all N stories".                             |
| Why readers trust us | The owner's About-page cards and the real writers; omitted when there is no content. |

Hero, latest, spotlight and more never repeat a story. Every section hides
itself when it has nothing to show, so a young site still looks complete.

`Reveal` (`components/ui`) animates a section into view once. It renders fully
visible on the server (works without JavaScript), only hides content that is
still below the fold after hydration, and does nothing for visitors who prefer
reduced motion.

## Stories page

`/articles` is the single page for search, topic, sort and the infinite list. The
logic is shared with Air Sports and documented once in
[`docs/sites/browse-and-feed.md`](../browse-and-feed.md). Travel Blog specifics:
the 12-story first batch, `ArticleCard` rows and cards, a sidebar with the latest
reads and the newsletter, and illustrated empty states.

## Typography

One font per job, set in `app/layout.tsx` and `packages/ui/src/styles.css`:

| Role               | Font (class)                    | Used for                                                                |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------- |
| Interface and body | Plus Jakarta Sans (`font-sans`) | Navigation, buttons, metadata, card excerpts, forms, short paragraphs.  |
| Display headlines  | Playfair Display (`font-serif`) | Hero, page and card titles, headings inside articles. Weight 600-700.   |
| Long-form reading  | Source Serif 4 (`font-reading`) | Article body, lists, quotes and the standfirst under the article title. |
| Accent             | Caveat (`font-handwriting`)     | One highlighted word in a headline.                                     |
| Code and counters  | JetBrains Mono (`font-mono`)    | Code blocks and tabular counters only.                                  |

Playfair has very high stroke contrast: it is excellent large and tiring as
body text, so long text uses Source Serif 4, which is drawn for reading.
Do not reach for `font-serif` for paragraphs.

## Story card

`ArticleCard` has two shapes. Below `md` it is a compact row (thumbnail beside
topic, title and date). From `md` it is a card with a 16:9 cover, a two-line
title, a two-line excerpt and a single-line footer: author on the left (long
names truncate), a short date (`Nov 7`, year only for older stories) and read
time on the right. The topic and "Guide" badges sit on the cover, so every title
starts at the same height. A single wide column never shows one huge photo.

## Reader reviews

`GET /public/sites/:key/posts/:slug/comments` returns the approved comments plus
`averageRating`, `ratingCount` and `ratingBreakdown` (reviews per star, 1 to 5).
The average is over **rated** comments only: a comment or reply without stars
neither counts nor dilutes it, and `total` (all comments, replies included) is
not the base of the average. The page uses `ratingCount` for "Based on N ratings".

On the article page (`components/article/comments/`):

- The rating summary and the reviews come first; writing one is a deliberate step
  behind a "Write a review" button, so the form never pushes the content down.
- The stars are real radio buttons (arrow keys, screen readers, form semantics).
  **Nothing is pre-selected**: the rating is optional and a default of five
  stars would skew every score.
- Validation is per field, in plain language, with the first problem focused
  (`lib/review.ts`, mirroring the API limits). A server refusal is shown beside
  the submit button.
- Reviews are pre-moderated. An approved one appears at once and updates the
  summary (`addRating` recomputes from the breakdown); a pending one gets a
  confirmation that says it will appear once checked. Focus moves to that message.
- Long threads show five reviews, then "Show more" in steps of ten.
- No badge or title is invented for a reviewer: readers see what they submitted.
