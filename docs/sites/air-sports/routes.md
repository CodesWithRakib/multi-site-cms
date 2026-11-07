# Air Sports Routing & Data Fetching

## 1. Public Route Table

`apps/sites/air-sports` utilizes Next.js 16 App Router with React Server Components (RSC) by default.

| Route Pattern        | Component Path                       | Rendering Mode   | Purpose & Content                                                                                                        |
| -------------------- | ------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `/`                  | `src/app/page.tsx`                   | ISR (30s)        | Radar feed: Breaking news ticker, featured hero story, active competition hubs, live timeline updates, and reports grid. |
| `/articles/[slug]`   | `src/app/articles/[slug]/page.tsx`   | Dynamic / ISR    | Full dispatch, article, or race analysis with author, telemetry, Schema.org NewsArticle, and safe ProseMirror AST.       |
| `/events`            | `src/app/events/page.tsx`            | ISR (60s)        | Championship directory listing active, upcoming, and completed competition hubs.                                         |
| `/events/[slug]`     | `src/app/events/[slug]/page.tsx`     | Dynamic / ISR    | Dedicated event hub with dates, overview, and chronological timeline of updates attached to this event.                  |
| `/categories`        | `src/app/categories/page.tsx`        | ISR (300s)       | Aviation disciplines index (paragliding, aerobatics, drone racing, etc.) with published dispatch counts.                 |
| `/categories/[slug]` | `src/app/categories/[slug]/page.tsx` | Dynamic / ISR    | Filtered chronological archive of dispatches in a discipline.                                                            |
| `/tags`              | `src/app/tags/page.tsx`              | ISR (300s)       | Topic tag index with dispatch counts.                                                                                    |
| `/tags/[slug]`       | `src/app/tags/[slug]/page.tsx`       | Dynamic / ISR    | Filtered chronological archive for a tag.                                                                                |
| `/about`             | `src/app/about/page.tsx`             | ISR (300s)       | Owner-written About page from the public site config (`resolveAboutContent`), with real authors and neutral fallbacks.   |
| `/search`            | `src/app/search/page.tsx`            | Dynamic SSR      | Server-rendered keyword search across published headlines and excerpts.                                                  |
| `/preview/[postId]`  | `src/app/preview/[postId]/page.tsx`  | SSR (No-Store)   | Authenticated editorial preview with signed HMAC token verification and crawler suppression headers.                     |
| `/sitemap.xml`       | `src/app/sitemap.ts`                 | Dynamic / Cached | Dynamic XML sitemap linking all published dispatches and events.                                                         |
| `/robots.txt`        | `src/app/robots.ts`                  | Static           | Search crawler rules (disallowing `/preview/*` and `/api/*`).                                                            |
| `/api/revalidate`    | `src/app/api/revalidate/route.ts`    | API Route        | Webhook receiver for instant cache invalidation triggered by outbox publishing events.                                   |

---

## 2. Server-Side Data Fetching & Caching Strategy

The client (`src/lib/api.ts`) communicates with the NestJS backend via HTTP:

```typescript
// src/lib/api.ts
export async function fetchArticles(params?: ListPublicPostsQuery) {
  const url = buildUrl('/posts', params);
  const res = await fetch(url, {
    next: {
      revalidate: 30, // 30s freshness window for high-velocity sports
      tags: ['air-sports-content'],
    },
    headers: { Accept: 'application/json' },
  });
  // ...
}
```

### Cache Tags & Invalidation

- All public Air Sports queries attach the cache tag `air-sports-content`.
- Single post queries attach `air-sports-post-${slug}`.
- Single event queries attach `air-sports-event-${slug}`.
- When an article is published, updated, or unpublished in the admin dashboard, the Phase 08 outbox worker fires an HTTP webhook to `/api/revalidate`, which purges cached pages globally via `revalidateTag`.

---

## 3. Build-Time Safety & Offline Resilience

During static page generation (`next build`), Server Components invoke data-fetching methods. If the API backend is offline during build time, unhandled `fetch` rejections (`ECONNREFUSED`) would fail the build.

To guarantee continuous build availability:

1. Every method in `src/lib/api.ts` wraps HTTP requests in defensive `try...catch` blocks.
2. In the event of network failure or connection refusal, methods return empty arrays or fallback payloads rather than throwing fatal exceptions.
3. Once the API server is online, dynamic runtime ISR automatically populates pages on subsequent requests.
