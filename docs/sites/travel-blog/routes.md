# Travel Blog Routing & Data Fetching

## 1. Public Routing Architecture

`apps/sites/travel-blog` leverages Next.js 16 App Router with React Server Components (RSC) by default. All data fetching occurs on the server, keeping the client bundle lean and eliminating waterfall client requests.

### Routing Table

| Route Pattern        | Component Path                       | Rendering Mode   | Purpose & Content                                                                                                                   |
| -------------------- | ------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | `src/app/page.tsx`                   | ISR (60s)        | Editorial homepage: Hero feature, Destination Guides spotlight, Latest Stories grid, Category badges.                               |
| `/articles`          | `src/app/articles/page.tsx`          | ISR (60s)        | The one page for finding stories: search (`?q=`), topic (`?category=`), tag, sort, infinite scroll. `/search` redirects here (308). |
| `/articles/[slug]`   | `src/app/articles/[slug]/page.tsx`   | Dynamic / ISR    | Long-form story or destination guide, rich-text body, author attribution, reading time, adjacent prev/next, related stories.        |
| `/destinations`      | `src/app/destinations/page.tsx`      | ISR (60s)        | Dedicated hub for travel guides and field notes (`type = 'travel_guide'`).                                                          |
| `/categories`        | `src/app/categories/page.tsx`        | ISR (300s)       | Taxonomy hub listing active categories with published article counts.                                                               |
| `/categories/[slug]` | `src/app/categories/[slug]/page.tsx` | Dynamic / ISR    | Filtered chronological archive of published articles in a category.                                                                 |
| `/tags`              | `src/app/tags/page.tsx`              | ISR (300s)       | Tag cloud / index listing tags with published article counts.                                                                       |
| `/tags/[slug]`       | `src/app/tags/[slug]/page.tsx`       | Dynamic / ISR    | Filtered chronological archive of published articles bearing a specific tag.                                                        |
| `/preview/[postId]`  | `src/app/preview/[postId]/page.tsx`  | SSR (No-Store)   | Authenticated editorial preview for drafts and scheduled revisions using HMAC token verification.                                   |
| `/sitemap.xml`       | `src/app/sitemap.ts`                 | Dynamic / Cached | Complete XML sitemap generated from backend public content endpoints.                                                               |
| `/robots.txt`        | `src/app/robots.ts`                  | Static           | Search crawler rules (disallows `/preview/*` and `/api/*`).                                                                         |
| `/api/revalidate`    | `src/app/api/revalidate/route.ts`    | API Route        | Webhook receiver for instant cache invalidation triggered by outbox publishing events.                                              |

---

## 2. Server-Side Data Fetching & Caching

The application communicates exclusively with the NestJS API via HTTP (`@multi-site-cms/api-client` and native `fetch` with Next.js caching extensions):

```typescript
// src/lib/api.ts
const SITE_KEY = 'travel-blog';

export async function fetchArticles(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  tag?: string;
  search?: string;
}) {
  const url = buildPublicUrl('/posts', params);
  const res = await fetch(url, {
    next: {
      revalidate: 60,
      tags: ['travel-blog-content'],
    },
    headers: { Accept: 'application/json' },
  });
  // ...
}
```

### Cache Tags & Granularity

- All public content queries attach the cache tag `travel-blog-content`.
- Specific single-entity fetches (e.g. `/posts/:slug`) attach both `travel-blog-content` and `travel-blog-post-${slug}`.
- Revalidation occurs automatically every 60 seconds (or 300 seconds for category/tag lists), or instantly on-demand via the webhook.

---

## 3. Resilience & Build-Time Safety

During static prerendering (`next build`), Server Components execute data-fetching routines. If the backend API service or local database is offline during build time, unhandled `fetch` failures (`ECONNREFUSED`) would break build pipelines.

To guarantee high availability and clean builds:

1. All client methods in `src/lib/api.ts` wrap HTTP requests in `try...catch` blocks.
2. In the event of network failure, functions return empty collections (`{ data: [], meta: { ... } }`) or `null`.
3. Server Components detect empty payloads gracefully and render responsive empty states without throwing 500 exceptions.
4. When the API returns online, dynamic runtime ISR automatically repopulates pages on subsequent requests.

---

## 4. Error Handling & 404 IDOR Protection

1. **Unpublished or Deleted Content**:
   - The backend strictly enforces `status = 'published'` and `published_at <= NOW()`.
   - Any attempt to access a draft, revision, or non-existent slug returns `404 Not Found`.
   - The route handler triggers Next.js `notFound()`, rendering the user-friendly editorial 404 page.

2. **Empty States**:
   - Zero-result search queries render a helpful search prompt with popular categories.
   - Taxonomy archives with zero matching articles display an informative status card guiding readers back to the destination guides or home page.
