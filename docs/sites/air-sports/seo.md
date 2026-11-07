# SEO & Schema.org Structured Data

## 1. Metadata Generation

`apps/sites/air-sports` implements dynamic metadata for all routes via Next.js 16 App Router metadata APIs:

- **Root Layout** (`src/app/layout.tsx`):
  - `title.template`: `%s | Air Sports Live`
  - Canonical base URL derived from `NEXT_PUBLIC_APP_URL`
  - Open Graph defaults: `type: 'website'`, `siteName: 'Air Sports Live'`, `locale: 'en_US'`
  - Twitter Cards configuration: `summary_large_image`
- **Dynamic Articles** (`src/app/articles/[slug]/page.tsx`):
  - Injects `seoTitle`, `seoDescription`, `canonicalUrl`, and featured image with dimensions.
- **Dynamic Events** (`src/app/events/[slug]/page.tsx`):
  - Injects championship event name, status, and dates.

---

## 2. Schema.org Structured Data (JSON-LD)

To enable Google Rich Snippets for sports coverage and live news, structured JSON-LD scripts are embedded on key routes:

### 2.1 Homepage

- **`schema.org/WebSite`**: Declares site name and search action target (`/search?q={search_term_string}`).
- **`schema.org/Organization`**: Declares editorial desk identity, logo URL, and verified social handles.

### 2.2 Articles & Live Dispatches

- **`schema.org/NewsArticle`**: Emitted for breaking news and live updates. Includes headline, datePublished, dateModified, author, and publisher.
- **`schema.org/Article`**: Emitted for standard articles and technical analysis.
- **`schema.org/BreadcrumbList`**: Breadcrumb hierarchy (`Radar` → `Category` → `Article Title`).

### 2.3 Events Hub (`schema.org/Event`)

- Embeds event name, description, `startDate`, `endDate`, and `eventStatus` (`EventScheduled`, `EventMovedOnline`, `EventCancelled`).

---

## 3. Crawler Control & Draft Suppression

- **`/sitemap.xml`**: Dynamically includes all published articles and core navigation hubs.
- **`/robots.txt`**: Allows indexation of `/`, `/articles/`, `/events/`, `/categories/`, `/tags/`, while explicitly disallowing `/preview/` and `/api/`.
- **`/preview/[postId]`**: Injects strict suppression headers:
  ```typescript
  export const metadata: Metadata = {
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  };
  ```

> Shared rules for both public sites (safe JSON-LD, canonical and Open Graph, sitemap, `llms.txt`): [SEO conventions](../seo-conventions.md).
