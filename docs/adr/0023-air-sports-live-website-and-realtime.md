# 23. Air Sports Public Website: Live Updates, Event Timelines, SSE Real-Time & Fallback Resilience

Date: 2026-11-01

## Status

Accepted

## Context

The `multi-site-cms` monorepo manages multiple independent public publications from a single centralized CMS backend.

Phase 11 introduces the second independent public website: **Air Sports** (`apps/sites/air-sports`).

Unlike the long-form editorial magazine style of the Travel Blog, Air Sports requires:

1. Low-latency delivery of breaking news, live heats, pilot standings, wind advisories, and weather warnings.
2. Independent visual branding (supersonic burnt orange and cockpit midnight ink, telemetry typography).
3. Real-time broadcast delivery without requiring heavy WebSocket daemons or paid third-party socket services.
4. Robust degradation when mobile spectators encounter high-altitude cellular loss or proxy stream termination.
5. Strict tenant isolation, ensuring only published Air Sports records are queryable.
6. Safe ProseMirror AST rendering, Schema.org NewsArticle structured data, and on-demand ISR cache revalidation.

## Decision

1. **Independent Next.js 16 App Router Architecture**:
   - Built inside `apps/sites/air-sports` using Next.js 16.4.3, React 19.3.1, and Tailwind CSS v4.
   - Distinct aviation typography utilizing `Inter` for prose and `JetBrains Mono` for telemetric data, wind readings, and timestamps.
   - Dedicated routes: `/`, `/articles/[slug]`, `/events`, `/events/[slug]`, `/categories/*`, `/tags/*`, `/search`, `/preview/[postId]`, `/sitemap.xml`, `/robots.txt`.

2. **Server-Sent Events (SSE) Real-Time Integration**:
   - Connects to the NestJS real-time broadcast stream at `/api/v1/realtime/air-sports/stream`.
   - Event notifications (`air_sports.update.published`) act as push signals; the client verifies newly published updates against authoritative REST endpoints (`/public/sites/air-sports/posts/:slug`) before prepending them to the live feed.
   - Client hook `useRealtimeStream` implements exponential backoff with jitter (2s, 4s, 8s, 16s, up to 30s) and ping watchdog monitoring (25s ping, 60s timeout).
   - Reconnecting clients supply `lastEventId` to backfill missed events from the server's 50-item circular buffer.

3. **Multi-Tier Degradation & Polling Fallback**:
   - If SSE connection fails repeatedly (5 consecutive attempts), the client transitions to `fallback` mode.
   - In fallback mode, background polling runs at a bounded 60-second interval, alongside window `visibilitychange` revalidation.
   - Displays a subtle, non-alarmist status indicator (`Live`, `Connecting`, `Reconnecting`, `Fallback`).

4. **Event Timelines & Custom Tiptap Blocks**:
   - Implements `eventTimelineBlock` custom Tiptap extension in `DocRenderer` (wind speed, weather conditions, alert levels, timestamps, status badges).
   - Prohibits `dangerouslySetInnerHTML` for content bodies; sanitizes URI protocols (`javascript:`, `data:`, `vbscript:` stripped).
   - Stable secondary sorting (`publishedAt DESC`, secondary `slug DESC`).

5. **Search Engine Optimization & Caching**:
   - Embeds Schema.org JSON-LD models (`WebSite`, `Organization`, `NewsArticle`, `Event`, `BreadcrumbList`).
   - Dynamic XML sitemap and crawler suppression on draft previews.
   - Next.js ISR tag caching (`revalidate: 30`, tag: `'air-sports-content'`).
   - Webhook route `/api/revalidate` triggers on-demand cache invalidation via outbox publishing events.

## Consequences

### Positive

- High-velocity sports coverage delivered in real time over standard HTTP without WebSocket operational overhead.
- Spectators experience uninterrupted reading even during severe connectivity loss due to bounded polling and tab-focus revalidation.
- Strict database constraints guarantee zero cross-site leakage between Travel Blog and Air Sports.

### Negative / Trade-offs

- Client verification against REST upon receiving SSE events adds an extra HTTP roundtrip per new article, but guarantees authoritative PostgreSQL consistency and prevents forged event display.
