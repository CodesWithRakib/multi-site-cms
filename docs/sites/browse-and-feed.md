# Finding stories: one page, one feed (both public sites)

Applies to `/articles` on `apps/sites/travel-blog` and `apps/sites/air-sports`.
Search, topic filter, sort and the list are **one page**; there is no separate
search page. `/search` permanently redirects (308) to `/articles` with the same
query string, so old links, bookmarks and indexed URLs keep working.

## What is shared and what is per site

The logic lives once in `@multi-site-cms/ui`; a site only supplies its look.

| In `packages/ui` (shared)                                                         | In each site                                              |
| --------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `lib/browse.ts`: URL state (`q`, `category`, `tag`, `sort`, `page`), `browseHref` | `app/articles/page.tsx`: layout, headings, copy           |
| `lib/feed.ts`: request validation, `nextToken`, `feedQueryString`                 | `app/api/articles/route.ts`: calls that site's CMS client |
| `lib/use-infinite-feed.ts`: the infinite-scroll hook                              | the card, its skeleton and the grid                       |
| `components/browse-controls.tsx`: search form, sort tabs, topic chips             | `lib/api.ts`: `fetchArticlesResult`                       |
| `components/feed-footer.tsx`: skeletons slot, retry, load more, status            |                                                           |
| `components/search-highlight.tsx`                                                 |                                                           |

Colors come from semantic tokens (`primary`, `muted`, `border`), so each site
keeps its own branding without a second implementation.

## Behaviour

- **URL is the state.** `?q=`, `?category=`, `?tag=`, `?sort=` are read once by
  `parseBrowseParams` (bad values fall back to defaults) and written by
  `browseHref`. The page, the links and the feed all use them, so every view is
  shareable. Search results are `noindex`.
- **One topic filter**, the chips above the list, with no counts (the list says how
  many match). Choosing a topic keeps the search text and sort. "All" has no
  filter and loads everything published. Topics with no published items are hidden.
- **First batch on the server**, so it is indexable and instant; the rest loads as
  the reader nears the end, with skeleton placeholders while loading and a retry
  button on failure. The feed is remounted (`key`) when the filters change, so a
  cursor never leaks between lists.
- **Cursor, not offset, for newest-first.** `GET /public/sites/:key/posts` returns
  `pagination.nextCursor` (null at the end); pass it back as `?cursor=`. The cursor
  is an opaque keyset `(published_at, id)`, so a story published while the reader
  scrolls is never skipped or repeated, and two stories with the same timestamp
  keep a stable order. `total` always means all items matching the filters. A
  malformed cursor, or a cursor with a sort other than newest, is a `400`.
- **Other sorts** (Popular, Oldest, A-Z) have no stable cursor and continue by page
  number. `nextToken` returns either `{ kind: 'cursor' }` or `{ kind: 'page' }`.
- **The browser never calls the CMS API.** The site's `/api/articles` route handler
  validates the query (`parseFeedRequest`), calls the API and returns
  `{ items, total, next }`. An upstream failure is a `502`, never an empty list,
  so the feed offers "try again" instead of silently ending.
- **Without JavaScript** the numbered `?page=N` links inside `<noscript>` keep every
  item reachable.
- **Freshness.** Lists, topics and the site config share a short window (60 seconds
  on the Travel Blog, 30 on Air Sports). When content is published the revalidation
  webhook refreshes them immediately (see `docs/publishing/cache-invalidation.md`);
  where it is not configured (local development) they follow within a minute or two.
