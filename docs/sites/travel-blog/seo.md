# Search Engine Optimization (SEO) & Structured Data

## 1. Metadata Generation Architecture

`apps/sites/travel-blog` implements a comprehensive SEO strategy utilizing Next.js 16 metadata APIs and JSON-LD structured data standards.

### Global & Default Metadata

The root layout (`src/app/layout.tsx`) establishes default metadata:

- `title.template`: `%s | Roam & Wander - Premium Travel Blog`
- `description`: Editorial tagline and mission statement
- `metadataBase`: Configured from `NEXT_PUBLIC_SITE_URL` (defaulting to `http://localhost:5000` or production domain)
- Open Graph default image, site name, and locale (`en_US`)
- Twitter Cards configuration (`summary_large_image`)

---

## 2. Dynamic Article Metadata

Every dynamic article route (`/articles/[slug]`) implements `generateMetadata`:

```typescript
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchArticleBySlug(slug);

  if (!post) {
    return { title: 'Story Not Found' };
  }

  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt;
  const canonicalUrl = post.seo?.canonicalUrl || `/articles/${post.slug}`;
  const ogImage = post.seo?.ogImage || post.featuredImage?.url || '/images/default-og.jpg';

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/articles/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}
```

---

## 3. Structured Data (Schema.org JSON-LD)

To maximize rich snippet appearance in search engine results pages (SERPs), semantic JSON-LD scripts are embedded on all primary pages.

### 3.1 Homepage Schema

- **`WebSite`**: Declares site search potential (`potentialAction: SearchAction`) pointing to `/search?q={search_term_string}`.
- **`Organization`**: Declares the editorial brand, logo, and social profile links.

### 3.2 Article & Travel Guide Schema (`BlogPosting`)

- Identifies the publication as a `BlogPosting` or `Article`.
- Embeds headline, excerpt description, published date, modified date, author attribution, and hero media.
- References the publisher organization with branding imagery.

### 3.3 Breadcrumb Schema (`BreadcrumbList`)

- Structured hierarchical trail: `Home` → `Destinations` (or Category) → `Article Title`.
- Enhances search result navigation links and helps crawlers parse site hierarchy.

---

## 4. Robots & Sitemap Discovery

### 4.1 XML Sitemap (`/sitemap.xml`)

- Generated dynamically by `src/app/sitemap.ts`.
- Fetches all published article slugs and timestamps from `/api/v1/public/sites/travel-blog/sitemap`.
- Includes static core routes (`/`, `/destinations`, `/categories`, `/tags`, `/search`).
- Populates `<lastmod>`, `<changefreq>`, and `<priority>` attributes accurately.

### 4.2 Robots Directives (`/robots.txt`)

- Allows full indexing of editorial archives (`/articles/`, `/destinations/`, `/categories/`, `/tags/`).
- Disallows administrative and preview endpoints:
  - `Disallow: /preview/`
  - `Disallow: /api/`
- Explicitly links to `sitemap: https://<domain>/sitemap.xml`.

### 4.3 Draft Preview Protection

- All routes under `/preview/[postId]` inject explicit HTTP and HTML crawler suppression headers:
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
