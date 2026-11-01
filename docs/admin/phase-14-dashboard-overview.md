# Phase 14 — Admin Dashboard Overview Implementation

## 1. Overview

Phase 14 delivers the complete, production-grade implementation of the Admin Dashboard Overview (`/`) in `apps/admin` backed by `apps/api` and PostgreSQL.

Target URL: `http://localhost:5000/`  
Backend API: `GET http://localhost:4000/api/v1/dashboard/overview`

---

## 2. Architecture & Design Direction

### 2.1 File Decomposition (< 250 Lines per File, `page.tsx` < 100 Lines)

The Overview dashboard is decomposed into modular feature components under `apps/admin/src/features/dashboard/components/`:

- [`page.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/app/page.tsx): Main route coordinator (**99 lines**) handling site scope, time window query params, loading skeletons, error alerts, and empty states.
- [`dashboard-header.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/dashboard-header.tsx): Heading, site badge, scope selector, date range selector (7/14/30/90 days), refresh button, and + New Post action.
- [`dashboard-metrics.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/dashboard-metrics.tsx) & [`dashboard-metric-item.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/dashboard-metric-item.tsx): Responsive metric cards rendering total content, published, drafts, scheduled, and active sites/archived with semantic icons.
- [`content-activity-chart.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/content-activity-chart.tsx): Pure SVG/Tailwind responsive time-series chart with stacked/grouped activity bars and hover tooltips.
- [`recent-content.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/recent-content.tsx): Editorial table showing top 8 recent articles/publications with site pills, status badges, publication slugs, and direct edit action links.
- [`recent-activity.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/recent-activity.tsx): Categorized security and editorial audit log feed with localized timestamps and actor attribution.
- [`quick-actions.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/quick-actions.tsx): Permission-aware quick action cards with directional arrows and context telemetry.
- [`dashboard-empty-state.tsx`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/admin/src/features/dashboard/components/dashboard-empty-state.tsx): Accessible empty state with primary CTA when zero content exists.

---

## 3. Backend API Contract (`GET /api/v1/dashboard/overview`)

### 3.1 Query Parameters

- `siteId` _(optional, UUID)_: Scopes metrics, time-series, recent content, and audit events to a specific site. If omitted, requires Super Admin privileges and aggregates across all sites.
- `days` _(optional, number, default 30)_: Time-series window (`7 | 14 | 30 | 90`).

### 3.2 Authorization Rules

- Protected by `AuthGuard` and `PermissionsGuard` with `@RequirePermissions('post:read')`.
- Non-Super Admins are strictly scoped to their assigned sites (`authorizedSiteIds`). Attempting to request unauthorized site IDs returns HTTP 404 (anti-enumeration).
- Super Admins can toggle between Platform Overview (unfiltered) or any specific site.

### 3.3 Response Envelope

```json
{
  "data": {
    "metrics": {
      "totalContent": 10,
      "publishedContent": 5,
      "draftContent": 2,
      "scheduledContent": 2,
      "archivedContent": 1,
      "activeSites": 2
    },
    "activity": [
      {
        "date": "2026-10-03",
        "published": 0,
        "draft": 0,
        "scheduled": 0
      }
    ],
    "recentContent": [
      {
        "id": "uuid",
        "title": "Aerobatics Masterclass: Handling High-G Pullouts and Disorientation Safely",
        "slug": "aerobatics-masterclass-high-g",
        "siteId": "uuid",
        "siteName": "Air Sports Live",
        "status": "SCHEDULED",
        "contentType": "ARTICLE",
        "updatedAt": "2026-11-01T15:47:00.000Z",
        "authorName": "Super Admin"
      }
    ],
    "recentActivity": [
      {
        "id": "uuid",
        "action": "post.publish.scheduled",
        "summary": "Scheduled publication of \"Aerobatics Masterclass...\"",
        "actorName": "Super Admin",
        "siteName": "Air Sports Live",
        "timestamp": "2026-11-01T15:47:00.000Z",
        "category": "publishing"
      }
    ]
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-11-01T15:06:09.120Z"
  }
}
```

---

## 4. Seed Data Fixtures (`apps/api/src/database/seeds/content.seed.ts`)

Run via `pnpm --filter @multi-site-cms/api db:seed:content`.
Seeds:

- 10 Realistic canonical posts (5 for Travel Blog, 5 for Air Sports Live)
- 10 Publications covering all lifecycle states: `PUBLISHED`, `DRAFT`, `SCHEDULED`, `ARCHIVED`
- 10 Realistic security and editorial audit log events.

---

## 5. Visual QA & Verification Results

Visual verification performed with `chrome-devtools-mcp`:

1. **Desktop (1440 × 900 px)**: Full 2-column editorial dashboard with SVG chart, responsive metrics grid, and audit feed (`docs/screenshots/dashboard-desktop-dark-1440.png`, `docs/screenshots/dashboard-desktop-light-1440.png`).
2. **Tablet (768 × 1024 px)**: Responsive collapsible sidebar, 2-row wrapped metric cards, responsive tables (`docs/screenshots/dashboard-tablet-768.png`).
3. **Mobile (375 × 667 px)**: Single-column stacked cards, horizontal table scrolling, touch targets >= 44px (`docs/screenshots/dashboard-mobile-375.png`).
4. **Site-Scoped View**: Site switcher dynamically updates metrics, time-series, table, and sidebar active context (`docs/screenshots/dashboard-scoped-travel-blog.png`).
5. **Localization**: English and Bengali toggles with localized status labels and Bengali numerals.
6. **Console & Network**: 0 console errors, 0 failed network requests.
