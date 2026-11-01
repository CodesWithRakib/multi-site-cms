# Admin Dashboard Route & Component Inventory

**Date:** 2026-11-01  
**Scope:** `apps/admin/src/app`  
**Standard:** Strict TypeScript, Role-Aware RBAC, Site-Scoped Isolation

---

## 1. Route Inventory Matrix

| Route Path    | File Path                     | Access Level               | Scoping                  | RTK Query Endpoints                                  | Key Mutations                                                                  | State Coverage                                      |
| ------------- | ----------------------------- | -------------------------- | ------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `/login`      | `src/app/login/page.tsx`      | Public (Unauthenticated)   | Global                   | None (Direct fetch/RTK auth)                         | `login`                                                                        | Idle, Loading, Error (Invalid credentials)          |
| `/`           | `src/app/page.tsx`            | Authenticated (Any Role)   | Site-scoped / Multi-site | `getSites`, `getSitePublications`, `getSystemHealth` | None                                                                           | Skeleton, Empty (No sites), Error, Success          |
| `/posts`      | `src/app/posts/page.tsx`      | Admin / Editor / Author    | Site-scoped (`siteId`)   | `getPublications`, `getCategories`, `getTags`        | `deletePublication`, `updateStatus`                                            | Table Skeleton, Empty Filter, Error Retry, Data     |
| `/posts/new`  | `src/app/posts/new/page.tsx`  | Admin / Editor / Author    | Site-scoped (`siteId`)   | `getCategories`, `getTags`, `getMedia`               | `createPublication`, `createDraft`                                             | Form Skeleton, Validation Errors, Submitting        |
| `/posts/[id]` | `src/app/posts/[id]/page.tsx` | Admin / Editor / Author    | Site-scoped (`siteId`)   | `getPublicationById`, `getRevisions`, `getTaxonomy`  | `updatePublication`, `publishPost`, `schedulePost`                             | Form Skeleton, 404 Not Found, Autosave indicator    |
| `/media`      | `src/app/media/page.tsx`      | Admin / Editor / Author    | Site-scoped / Global     | `getMediaAssets`, `getMediaDetails`                  | `uploadMedia`, `deleteMediaAsset`, `updateMediaMetadata`                       | Grid Skeleton, Empty Upload Dropzone, Error, Loaded |
| `/taxonomy`   | `src/app/taxonomy/page.tsx`   | Admin / Editor             | Site-scoped (`siteId`)   | `getCategories`, `getTags`                           | `createCategory`, `updateCategory`, `deleteCategory`, `createTag`, `deleteTag` | Tabs Skeleton, Empty Table, Creation Dialog, Error  |
| `/publishing` | `src/app/publishing/page.tsx` | Admin / Editor / Publisher | Site-scoped (`siteId`)   | `getScheduledPublications`, `getPublishingQueue`     | `publishNow`, `reschedulePost`, `cancelScheduled`                              | Calendar Skeleton, Empty Queue, Real-time status    |
| `/sites`      | `src/app/sites/page.tsx`      | Super Admin Only           | Global                   | `getSites`, `getDomainRegistry`                      | `createSite`, `updateSiteStatus`, `deleteSite`                                 | Card Skeleton, Empty Sites, Add Site Dialog, Error  |
| `/sites/[id]` | `src/app/sites/[id]/page.tsx` | Super Admin Only           | Global / Site            | `getSiteById`, `getSiteDomains`, `getSiteSettings`   | `updateSite`, `addCustomDomain`, `verifyDomain`                                | Form Skeleton, Domain Verification State, Error     |
| `/users`      | `src/app/users/page.tsx`      | Super Admin Only           | Global                   | `getUsers`, `getPlatformRoles`, `getSites`           | `createUser`, `updateUserRole`, `assignSiteMembership`, `deactivateUser`       | Table Skeleton, Empty Users, Invite Dialog, Error   |
| `/settings`   | `src/app/settings/page.tsx`   | Super Admin Only           | Global                   | `getSystemSettings`, `getCacheStatus`                | `updateSettings`, `purgeCache`, `toggleMaintenance`                            | Skeleton, Setting Toggles, Save Confirmation        |
| `/audit-logs` | `src/app/audit-logs/page.tsx` | Super Admin Only           | Global                   | `getAuditLogs`                                       | None (Read-only)                                                               | Table Skeleton, Filter Empty, JSON Viewer           |
| `/help`       | `src/app/help/page.tsx`       | Authenticated (Any Role)   | Global                   | None (Static)                                        | None                                                                           | Immediate render, Search filter                     |
| `/forbidden`  | `src/app/forbidden/page.tsx`  | Authenticated              | Global                   | None                                                 | None                                                                           | 403 Forbidden State, Switch Site Button             |

---

## 2. Authentication & Authorization Guarding

Each route must enforce two levels of protection:

1. **Client Guard (`AuthGuard.tsx`)**:
   - Inspects Redux auth state (`user`, `isAuthenticated`).
   - If unauthenticated and path is not `/login`, redirects to `/login?redirect=<path>`.
   - If route requires `SuperAdmin` role and `user.role !== 'SUPER_ADMIN'`, redirects to `/forbidden`.
2. **Server-Side Authorization**:
   - Every API query sent by RTK Query passes session cookies.
   - The backend `AuthGuard` and `PermissionsGuard` validate JWT/session credentials and reject unauthorized operations with `401 Unauthorized` or `403 Forbidden`.

---

## 3. UI State Standardization

To ensure zero "AI-generated" or unpolished screens, all 15 routes must implement uniform state patterns:

### 3.1 Loading State

- Never render a generic centered full-page spinner.
- Use view-specific skeletons that mirror the layout (e.g., `TableSkeleton`, `CardGridSkeleton`, `FormSkeleton`).
- Shimmer animation must use `@multi-site-cms/ui` `<Skeleton>` primitive.

### 3.2 Empty State

- Display when a query returns an empty collection (`items.length === 0`).
- Must include:
  1. Semantic icon inside an enclosed muted badge.
  2. Clear heading (e.g., "No published articles found").
  3. Actionable description explaining why the list is empty.
  4. Primary CTA button (e.g., "Create New Article", "Clear Filters").

### 3.3 Error State

- Display when RTK Query encounters an HTTP 500, network loss, or schema error.
- Must include:
  1. Destructive-tinted alert card.
  2. Actionable error explanation.
  3. "Retry Request" button bound to the query's `refetch()` trigger.

### 3.4 Unauthorized State

- Displayed when user lacks site membership or platform role for the requested resource.
- Offers direct actions: "Switch Site" or "Return to Dashboard".
