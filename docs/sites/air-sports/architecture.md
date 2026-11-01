# Air Sports Website Architecture

## 1. System Overview

`apps/sites/air-sports` is an independent public publication in the `multi-site-cms` monorepo. It delivers real-time aeronautical coverage, live event updates, championship race leaderboards, and weather/wind telemetries.

```
                    ┌─────────────────────────────────────────┐
                    │       Air Sports Public Website         │
                    │   apps/sites/air-sports (Next.js 16)    │
                    └──────────────┬──────────────────┬───────┘
                                   │                  │
                HTTP / JSON (ISR)  │                  │ Server-Sent Events (SSE)
       /api/v1/public/sites/       │                  │ /api/v1/realtime/
             air-sports/*          ▼                  ▼   air-sports/stream
                    ┌─────────────────────────────────────────┐
                    │        NestJS Public API Service        │
                    │      (Modular Monolith @ Port 4000)     │
                    └────────────────────┬────────────────────┘
                                         │ TypeORM
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │         PostgreSQL 18 Database          │
                    │      (Enforces tenant boundaries &      │
                    │         status = 'published')           │
                    └─────────────────────────────────────────┘
```

---

## 2. Key Architecture Principles

1. **Independent Visual Identity & Design System**:
   - Distinct from the Travel Blog's editorial magazine aesthetic.
   - Designed around aeronautical precision, speed, altitude, and telemetry.
   - Color tokens: supersonic burnt orange (`--primary`), cockpit midnight ink (`--foreground`), crisp high-altitude tint (`--background`).
   - Font pairings: `Inter` for clean prose and `JetBrains Mono` for telemetric timestamps, wind speeds, and pilot statistics.

2. **Backend as Sole Authority**:
   - Zero direct database connections from the frontend.
   - All content queries route through `/api/v1/public/sites/air-sports/*`.
   - The backend strictly enforces `WHERE site.key = 'air-sports' AND pub.status = 'published' AND pub.published_at <= NOW() AND post.deleted_at IS NULL`.
   - Unapproved drafts, scheduled dispatches, or archived records return `404 Not Found`.

3. **Hybrid Real-Time Delivery Model**:
   - Authoritative content resides in PostgreSQL.
   - Real-time notifications arrive via Server-Sent Events (SSE) over standard HTTP.
   - Event notifications serve as low-latency signals; the client verifies newly published updates through the authoritative REST API before displaying them.
   - If SSE connections fail or reverse proxies drop streams, the application seamlessly falls back to bounded polling (60s) and focus revalidation.

4. **Server Components (RSC) by Default**:
   - Every page route is rendered on the server with minimal client JavaScript.
   - Client Component boundaries (`'use client'`) are strictly isolated:
     - `Header.tsx`: Mobile menu drawer toggle.
     - `LiveTimeline.tsx` / `useRealtimeStream.ts`: SSE listener, deduplication, and status pill.
     - `ShareButtons.tsx`: Web Share API and clipboard actions.
