# 22. Travel Blog Public Website: Server Components, SEO, Multi-Tier Caching & Safe Doc Rendering

Date: 2026-11-01

## Status

Accepted

## Context

The `multi-site-cms` monorepo manages independent public publication websites through a single centralized administrative application and shared NestJS backend.

Phase 10 requires implementing the first public website: `apps/sites/travel-blog`.

The Travel Blog must:

1. Provide a premium, responsive editorial reading experience for articles and destination guides.
2. Consume content from the shared NestJS API without direct database access.
3. Strictly isolate published content (`status = 'published'`, `published_at <= NOW()`), returning opaque 404 errors for drafts or unpublished revisions.
4. Render structured Tiptap / ProseMirror AST safely without raw HTML injection or XSS risks.
5. Maximize SEO performance through Open Graph metadata, canonical links, and Schema.org JSON-LD structured data.
6. Achieve optimal Core Web Vitals via React Server Components (RSC), Next.js Image optimization, and Incremental Static Regeneration (ISR).
7. Support authenticated draft previews via signed HMAC tokens with search crawler suppression.

## Decision

1. **Next.js App Router Architecture with React Server Components**:
   - Implemented within `apps/sites/travel-blog` using Next.js 16.4.3, React 19, and Tailwind CSS v4.
   - All page routes (`/`, `/articles/[slug]`, `/destinations`, `/categories/*`, `/tags/*`; search is part of `/articles`, and `/search` permanently redirects there) are React Server Components by default, emitting zero JavaScript bundles for editorial article bodies.
   - Client Component boundaries (`'use client'`) are strictly restricted to minimal interactive leaves: `Header.tsx` (mobile navigation drawer) and `ShareButtons.tsx` (Web Share API).

2. **Backend as Sole Authority via Public Content Discovery API**:
   - The frontend never connects directly to PostgreSQL.
   - All content retrieval routes through `/api/v1/public/sites/:siteKey/*` (`apps/api/src/posts/public-content.controller.ts`).
   - The backend strictly enforces `WHERE site.key = :siteKey AND pub.status = 'published' AND pub.published_at <= NOW()`.
   - Single-post requests for unpublished, scheduled, or deleted articles return `404 Not Found`.

3. **Safe AST Rendering via `DocRenderer`**:
   - Prohibits `dangerouslySetInnerHTML` for editorial content bodies.
   - Transforms structured ProseMirror JSON nodes directly into type-safe, accessible React JSX primitives.
   - Sanitizes and validates all URI schemes against an allowlist (`http:`, `https:`, `mailto:`, `tel:`), completely stripping dangerous protocols (`javascript:`, `data:`, `vbscript:`).
   - Generates deterministic anchor IDs for headings to enable deep-linking.
   - Supports rich domain extensions: `destinationInfoBlock` (travel facts, season, currency, languages) and `callout` (editorial notes and warnings).

4. **SEO & Structured Data**:
   - Every dynamic route exports a typed `generateMetadata` function providing Open Graph tags, Twitter Cards (`summary_large_image`), and canonical links.
   - Injects Schema.org JSON-LD scripts:
     - `WebSite` and `Organization` on the homepage.
     - `BlogPosting` on article and travel guide detail pages.
     - `BreadcrumbList` on all hierarchical taxonomy and guide pages.
   - Implements dynamic `/sitemap.xml` and `/robots.txt`.

5. **Multi-Tier Caching & Resilience**:
   - NestJS public endpoints generate deterministic SHA-256 ETags and support HTTP 304 Not Modified responses.
   - Frontend Server Components use Next.js fetch cache with tag-based ISR (`revalidate: 60`, `tags: ['travel-blog-content']`).
   - All data-fetching calls wrap network requests in defensive `try...catch` handlers, ensuring `next build` static prerendering succeeds cleanly even when the backend is offline.
   - Webhook route `/api/revalidate` enables instant on-demand cache revalidation when outbox publishing events trigger.

6. **Authenticated Draft Preview**:
   - Implemented at `/preview/[postId]` using signed HMAC tokens.
   - Injects crawler suppression headers (`noindex, nofollow, nocache`) to ensure unpublished drafts never enter search engine indices.

## Consequences

### Positive

- Strict tenant boundary and published-state isolation prevent data leakage of unpublished articles.
- Zero raw HTML injection eliminates stored XSS vulnerabilities.
- RSC-first architecture ensures near-instant Largest Contentful Paint (LCP) and zero Cumulative Layout Shift (CLS).
- Independent deployability of `apps/sites/travel-blog` without frontend coupling to other sites or the admin dashboard.

### Negative / Trade-offs

- Rendering ProseMirror AST through custom React components requires maintaining mapping definitions for any new editor extensions added in future phases.
