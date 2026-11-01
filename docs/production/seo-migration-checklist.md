# SEO Architecture, Metadata & Search Console Migration Checklist

This document details the search engine optimization (SEO) architecture, canonical routing standards, Schema.org structured data schemas, and manual search console migration procedures for public sites on the `multi-site-cms` platform.

---

## 1. URL Inventory & Canonical Routing

Each public website enforces clean, semantic URL structures without trailing slashes:

### Travel Blog (`apps/sites/travel-blog`)

| Content Type             | URL Pattern          | Canonical URL Header / Tag                                         |
| :----------------------- | :------------------- | :----------------------------------------------------------------- |
| **Homepage**             | `/`                  | `https://travel.yourdomain.com`                                    |
| **Article / Guide**      | `/articles/[slug]`   | `https://travel.yourdomain.com/articles/[slug]`                    |
| **Destination Category** | `/categories/[slug]` | `https://travel.yourdomain.com/categories/[slug]`                  |
| **Topic Tag**            | `/tags/[slug]`       | `https://travel.yourdomain.com/tags/[slug]`                        |
| **Keyword Search**       | `/search?q=...`      | `https://travel.yourdomain.com/search` (`noindex` on empty search) |
| **Draft Preview**        | `/preview/[postId]`  | **`noindex, nofollow, noarchive`**                                 |

### Air Sports Live (`apps/sites/air-sports`)

| Content Type               | URL Pattern          | Canonical URL Header / Tag                           |
| :------------------------- | :------------------- | :--------------------------------------------------- |
| **Live Desk**              | `/`                  | `https://airsports.yourdomain.com`                   |
| **Race Report / Update**   | `/articles/[slug]`   | `https://airsports.yourdomain.com/articles/[slug]`   |
| **Championship Event Hub** | `/events/[slug]`     | `https://airsports.yourdomain.com/events/[slug]`     |
| **Discipline Archive**     | `/categories/[slug]` | `https://airsports.yourdomain.com/categories/[slug]` |
| **Telemetry Tag**          | `/tags/[slug]`       | `https://airsports.yourdomain.com/tags/[slug]`       |
| **Draft Preview**          | `/preview/[postId]`  | **`noindex, nofollow, noarchive`**                   |

---

## 2. Dynamic XML Sitemaps & Crawler Directives

### XML Sitemap (`/sitemap.xml`)

Implemented via dynamic Next.js App Router route handlers ([`travel-blog/sitemap.ts`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/sites/travel-blog/src/app/sitemap.ts) and [`air-sports/sitemap.ts`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/sites/air-sports/src/app/sitemap.ts)):

- Queries published post slugs and timestamps dynamically from `/api/v1/public/sites/:siteKey/sitemap`.
- Caches sitemap output with 5-minute revalidation.
- Only includes published articles; draft, scheduled, archived, and preview URLs are strictly excluded.

### Robots Directives (`/robots.txt`)

Generated dynamically via Next.js `robots.ts`:

```text
User-Agent: *
Allow: /
Disallow: /preview/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
```

---

## 3. Structured Data (JSON-LD) Implementations

1. **`Article` & `NewsArticle`**:
   - Injected on article detail pages with headline, publication date, modification date, author name, and publisher metadata.
2. **`LiveBlogPosting`**:
   - Injected on Air Sports live updates to signal real-time coverage updates to search engine crawlers.
3. **`Event`**:
   - Injected on `/events/[slug]` with competition dates, event status (`EventScheduled`, `EventLive`, `EventPostponed`), and venue location.
4. **`BreadcrumbList`**:
   - Hierarchical breadcrumbs linking `Home > Category > Article`.
5. **`WebSite` & `Organization`**:
   - Injected on the homepage with official site name, tagline, and logo URLs.

---

## 4. Google Search Console Migration Checklist

When transitioning existing production domains to the new `multi-site-cms` platform:

- [ ] **Property Verification**: Verify domain ownership in Google Search Console via DNS TXT record.
- [ ] **Sitemap Submission**: Submit `https://<site-domain>/sitemap.xml` for both Travel Blog and Air Sports properties.
- [ ] **301 Permanent Redirect Mapping**: If migrating legacy article URLs, configure 301 redirects in Next.js `next.config.ts` `redirects()` array:
  ```typescript
  async redirects() {
    return [
      {
        source: '/legacy-posts/:slug',
        destination: '/articles/:slug',
        permanent: true,
      },
    ];
  }
  ```
- [ ] **Canonical URL Verification**: Use Google URL Inspection tool on 5 representative published articles to confirm that Google selects the user-declared canonical.
- [ ] **Mobile Usability & Core Web Vitals**: Verify that LCP (Largest Contentful Paint) < 2.5s and CLS (Cumulative Layout Shift) < 0.1 across mobile viewports.
- [ ] **Preview Route Indexing Check**: Confirm that `/preview/*` routes are excluded from Google indexing and report zero indexed preview pages.
