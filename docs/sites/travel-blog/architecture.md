# Travel Blog Architecture

## 1. System Overview

`apps/sites/travel-blog` is an independent public publication powered by the shared `multi-site-cms` platform. It serves long-form editorial stories, field notes, destination guides, and visual journeys.

```
                    ┌──────────────────────────────┐
                    │    Travel Blog Frontend      │
                    │   (Next.js App Router v16)   │
                    └──────────────┬───────────────┘
                                   │ HTTP / JSON
                                   │ (Tag-cached ISR)
                                   ▼
                    ┌──────────────────────────────┐
                    │     NestJS Public API        │
                    │ /api/v1/public/sites/        │
                    │   travel-blog/*              │
                    └──────────────┬───────────────┘
                                   │ TypeORM
                                   ▼
                    ┌──────────────────────────────┐
                    │      PostgreSQL 18 DB        │
                    │  (Enforces site isolation    │
                    │   & status = 'published')    │
                    └──────────────────────────────┘
```

## 2. Key Architecture Principles

1. **Backend as Sole Authority**:
   - The frontend never connects directly to PostgreSQL.
   - All content retrieval routes through `/api/v1/public/sites/:siteKey/*`.
   - The backend strictly enforces `WHERE site.key = :siteKey AND pub.status = 'published' AND pub.published_at <= NOW()`.
   - Unpublished drafts, scheduled dispatches, and archived posts return an opaque `404 Not Found` to prevent slug guessing.

2. **Server Components by Default**:
   - Every route (`/`, `/articles/[slug]`, `/categories/*`, `/tags/*`, `/destinations`, `/search`) is rendered via React Server Components.
   - Zero JavaScript payload for article bodies and editorial prose.
   - Client Component boundaries (`'use client'`) are strictly restricted to interactive leaves:
     - Header mobile menu toggle (`Header.tsx`)
     - Web Share API and link copying (`ShareButtons.tsx`)

3. **Incremental Static Regeneration (ISR)**:
   - Front page and destination hubs revalidate every 60 seconds (`revalidate = 60`).
   - Category and tag archives revalidate every 300 seconds (`revalidate = 300`).
   - On-demand cache invalidation is triggered through `/api/revalidate` by the Phase 08 transactional outbox publisher whenever an article is published, updated, or unpublished.

4. **Security & Content Integrity**:
   - Stored Tiptap AST is never evaluated as raw HTML (`dangerouslySetInnerHTML` is prohibited for body rendering).
   - AST nodes are rendered through `DocRenderer`, mapping each node to accessible, sanitized React primitives.
   - Dangerous URI schemes (`javascript:`, `data:`, `vbscript:`) are rejected and stripped.
