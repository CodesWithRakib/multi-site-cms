# Performance, Caching & Core Web Vitals

## 1. Core Web Vitals Optimization

The Air Sports frontend is built to sustain fast page rendering and low latency under peak sporting events:

| Metric                              | Target  | Solution Implemented                                                                   |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | < 1.8s  | Hero image `priority` loading, pre-rendered Server Components, self-hosted web fonts.  |
| **INP** (Interaction to Next Paint) | < 100ms | Zero JavaScript bodies; no AST parser or Tiptap library shipped to the client browser. |
| **CLS** (Cumulative Layout Shift)   | < 0.05  | Reserved aspect ratios (`aspect-[16/10]`, `aspect-[16/9]`) for all images and embeds.  |

---

## 2. Server Components (RSC) by Default

- All editorial prose, navigation, headers, and footer layouts are rendered as React Server Components.
- Client Component boundaries (`'use client'`) are strictly confined to interactive components:
  - `Header.tsx`: Mobile navigation toggle.
  - `LiveTimeline.tsx` / `useRealtimeStream.ts`: SSE stream listener and local deduplication.
  - `ShareButtons.tsx`: Web Share API.
- Total client JavaScript bundle remains under 85 KB gzipped.

---

## 3. Image Optimization (`next/image`)

All aviation photographs and cockpit imagery utilize Next.js `<Image>`:

- Automatically serves modern WebP / AVIF formats.
- Hero images use `priority={true}` to prevent LCP degradation.
- Explicit `sizes` attribute matches responsive viewport breakpoints (`(max-width: 1024px) 100vw, 896px`).

---

## 4. Multi-Tier Caching Architecture

1. **NestJS Public API**:
   - SHA-256 ETags generated deterministically over response bodies.
   - Responds with `304 Not Modified` on matching `If-None-Match`.
   - `Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=300`.
2. **Next.js ISR**:
   - Page route revalidation window set to 30 seconds (`revalidate = 30`).
   - On-demand purge webhook at `/api/revalidate` triggered by Phase 08 outbox worker upon publication events.
