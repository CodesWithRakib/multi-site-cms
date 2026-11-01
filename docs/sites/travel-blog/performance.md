# Performance, Caching & Core Web Vitals

## 1. Core Web Vitals Strategy

`apps/sites/travel-blog` is engineered to achieve optimal Google Lighthouse and Core Web Vitals scores across mobile and desktop devices.

### Target Benchmarks

| Metric                                    | Target  | Architecture Solution                                                            |
| ----------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)        | < 1.8s  | Hero image `priority` loading, SSR pre-rendering, local font preloading.         |
| **FID / INP** (Interaction to Next Paint) | < 100ms | Server Components by default; zero client JavaScript for article body rendering. |
| **CLS** (Cumulative Layout Shift)         | < 0.05  | Aspect ratio reservation for all images, cards, and video embeds.                |

---

## 2. Server Components & Minimal JavaScript Footprint

Editorial prose, lists, categories, and typography do not require browser JavaScript execution.

- **Zero-Hydration Bodies**: The article body is parsed and transformed into HTML on the server by `DocRenderer`. No AST parser, Tiptap runtime, or markdown libraries are sent to the client browser.
- **Client Component Isolation**:
  - `Header.tsx`: Contains only the mobile menu open/close toggle state.
  - `ShareButtons.tsx`: Contains only the Web Share API and navigator clipboard invocation.
- Total client JavaScript bundle size remains under 80 KB gzipped.

---

## 3. Next.js Image Optimization

All article cover photos, author avatars, and editorial inline media are rendered through Next.js `<Image>`:

1. **Format Optimization**: Automatically transcoded into AVIF and WebP based on user agent capabilities.
2. **Above-the-Fold LCP Prioritization**:
   - The primary featured hero on `/` and `/articles/[slug]` sets `priority={true}`.
   - Prevents lazy loading delays for the largest visible editorial asset.
3. **Responsive Sizing**: Configured with explicit `sizes` attributes:
   ```tsx
   sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
   ```
4. **CLS Prevention**: Explicit width and height attributes or `fill` with parent `aspect-[16/10]` containers reserve space before the image binary downloads.

---

## 4. Multi-Tier Caching Architecture

```
User Request
     │
     ▼
┌───────────────────────────────┐
│ Next.js ISR Edge Cache        │  Hit ──> Serve instant static HTML
│ (Tag: 'travel-blog-content')  │
└──────────────┬────────────────┘
               │ Miss / Revalidate (60s)
               ▼
┌───────────────────────────────┐
│ NestJS Public API Service     │
│  - ETag Generation (SHA-256)  │  Match ──> 304 Not Modified
│  - Cache-Control: max-age=60  │
└──────────────┬────────────────┘
               │ DB Query
               ▼
┌───────────────────────────────┐
│ PostgreSQL 18 Multi-Tenant DB │
│ (Indexed on site_id, status)  │
└───────────────────────────────┘
```

### 4.1 On-Demand Invalidation

When an author publishes, updates, or archives an article in the Admin Dashboard, the Phase 08 Outbox dispatcher delivers an HTTP webhook to `/api/revalidate`. The handler executes:

```typescript
revalidateTag('travel-blog-content', 'default');
```

Purging stale cache entries globally across CDN and server nodes within milliseconds.

---

## 5. Web Typography Optimization

The application uses `next/font/google` for zero-layout-shift font delivery:

- **Playfair Display**: Used for elegant editorial headlines and hero titles.
- **Inter**: Used for clean, legible body text and interface controls.
- **Optimization Controls**:
  - `display: 'swap'` prevents Flash of Invisible Text (FOIT).
  - Fonts are downloaded at build time and self-hosted with static assets, eliminating third-party DNS lookups to `fonts.googleapis.com`.
