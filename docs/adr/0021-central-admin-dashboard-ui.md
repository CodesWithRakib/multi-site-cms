# 21. Central Admin Dashboard UI & Multi-Site Operational Workspaces

Date: 2026-11-01

## Status

Accepted

## Context

The `multi-site-cms` monorepo manages multiple independent public publication websites (Travel Blog, Air Sports, and future website tenants) from a single centralized administrative application (`apps/admin`).

Two distinct administrative personas interact with this dashboard:

1. **Platform Super Admin**: Platform owners with platform-wide privileges (site registry, domain verification, administrator creation, cross-site publishing telemetry).
2. **Client Site Admin**: Site-scoped administrators restricted strictly to explicitly assigned sites and granted permissions.

Prior phases completed the backend modular monolith (`apps/api`), database schema, auth/RBAC engine, site registry, core CMS, Tiptap editor, media upload, and the transactional publishing engine. Phase 09 required implementing the complete, production-ready admin UI without duplicating backend logic or introducing competing state architectures.

## Decision

1. **Next.js App Router Architecture**:
   - Built inside `apps/admin` using Next.js 16.4.3, React 19, and Tailwind CSS v4.
   - App Router shell layout (`ShellLayout`) encapsulating responsive mobile/desktop sidebars, header, site switcher, and route-level authorization guards (`AuthGuard`).
   - Pure client/server split with Next.js Turbopack compilation and pre-rendered static routes.

2. **Unified State & API Contract**:
   - Application state is managed via Redux Toolkit (`@multi-site-cms/redux`), with RTK Query endpoints injected into `cmsApi` (`apps/admin/src/lib/cms-api.ts`).
   - Tag invalidation covers `'Post'`, `'Media'`, `'Site'`, `'User'`, `'Publication'`, `'Taxonomy'`, `'Health'`, and `'Auth'`.
   - All HTTP requests default to `credentials: 'include'` to transparently pass session and CSRF cookies across ports (`http://localhost:5000` to `http://localhost:4000`).

3. **Active Site Scoping & Context Engine (`AdminContext`)**:
   - `AdminProvider` and `useAdmin()` hook govern the active site context (`activeSiteId`), session state, permissions check (`can`), unsaved form tracking, and bilingual locale (`'en'` vs `'bn'`).
   - Client admins default to their first assigned site and cannot switch to platform view or unauthorized sites.
   - Unsaved changes trigger a protective browser confirmation modal when navigating or switching sites.

4. **Multi-Site Editorial & Publishing Controls**:
   - Clear separation between canonical source content (`PostItem`) and site-specific publications (`PostPublicationItem`).
   - Reusable `PublishingModal` supporting immediate publishing, future scheduling (with $\ge 5$s validation), rescheduling, schedule cancellation, unpublishing, and archiving.
   - Interactive Publishing Calendar supporting Month and Chronological List views with timezone-aware datetime rendering.

5. **Tenant & Identity Governance**:
   - Dedicated Site Registry (`/sites`) with automated slug generation, lifecycle controls, and DNS TXT verification challenge modal.
   - User Management (`/users`) with account creation, status toggles (active/suspended), RBAC role assignments, and hard-coded safeguards protecting the last active Super Admin.

6. **Bilingual Localization (English & Bangla)**:
   - Complete dictionary symmetry between English and Bangla across navigation, actions, statuses, publishing dialogs, media, and taxonomy.
   - Dual-access dictionary supporting typed property access (`t.dashboard.title`) and path invocation (`t('users.title')`).

## Consequences

### Positive

- Unified, consistent administrative experience across all managed publications.
- Seamless multi-site switching without state pollution or memory leaks.
- Zero client-side authorization bypass: backend continues to enforce strict site scoping and RBAC.
- Real-time background worker and transactional outbox telemetry directly visible on the platform overview.

### Negative / Trade-offs

- Static prerendering requires dynamic search parameters to be wrapped in React Suspense boundaries (addressed in `/login`).
- Cross-port cookie auth requires explicit credentials handling in fetch and CORS configuration in the API.
