# Site Management & Tenant Lifecycle

## 1. Overview

`multi-site-cms` is architected as a centralized multi-tenant content management system. The platform hosts multiple independent public websites (e.g., `travel-blog`, `air-sports`) through a unified database schema and a single modular NestJS backend.

Tenant management is governed by strict lifecycle states, soft-deletion semantics, and immutable audit logs.

---

## 2. Tenant Lifecycle States

Each site maintains a state column `status` constrained by the PostgreSQL check constraint `CHK_sites_status`:

```sql
CONSTRAINT "CHK_sites_status" CHECK ("status" IN ('active', 'paused', 'archived', 'suspended'))
```

### State Definitions

| Status      | Description                                                               | Public API Behavior                                | Admin API Behavior                                                       |
| ----------- | ------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `active`    | Fully operational site.                                                   | Serves public configuration and published content. | Permitted for assigned Admins and Super Admins.                          |
| `paused`    | Temporarily put on hold by management.                                    | Returns `404 NOT FOUND`.                           | Read and edit permitted for Admins and Super Admins; publishing blocked. |
| `archived`  | Soft-deleted / deprecated site.                                           | Returns `404 NOT FOUND`.                           | Read-only access for Super Admins; hidden from normal workflows.         |
| `suspended` | Administratively shut down (e.g., security violation or payment failure). | Returns `404 NOT FOUND`.                           | Read-only access for Super Admins; Client Admins denied.                 |

---

## 3. Soft-Deletion & Archiving Policy

To prevent data corruption, historical record loss, and broken foreign key references:

1. **Active Sites Cannot Be Deleted**: Attempting to delete a site in `active` status is rejected with `400 BAD REQUEST` (`VALIDATION_ERROR`). The site must first be transitioned to `paused` or `archived`.
2. **Sites with Content Cannot Be Hard-Deleted**: If a site has any associated content publications (`post_publications`), hard deletion is strictly forbidden to prevent orphaning revisions, editorial history, or media references. The service automatically downgrades the operation to a safe soft-archive (`status = 'archived'`).
3. **Database Relational Integrity**: All child entities (`site_domains`, `categories`, `tags`, `post_publications`, `user_role_assignments`) maintain explicit foreign key constraints (`ON DELETE RESTRICT` or `CASCADE` where safe).
4. **Append-Only Audit Trail**: Every status transition and archiving operation emits an immutable record to `audit_events`.

---

## 4. Administrative Operations

### Endpoints (Super Admin Only)

- `POST /api/v1/sites` — Create a new tenant site. Emits audit action `site.create`.
- `GET /api/v1/sites` — List all tenant sites (supports filtering by `status`, search query, and pagination).
- `GET /api/v1/sites/:siteId` — Retrieve site details and associated domains.
- `PATCH /api/v1/sites/:siteId` — Update site name, status, default locale, or description. Emits audit action `site.update`.
- `DELETE /api/v1/sites/:siteId` — Soft-delete or archive tenant site. Emits audit action `site.delete` or `site.archive`.

### Client Admin Access

Ordinary Client Admins:

- Can only list (`GET /api/v1/sites`) and view sites to which they have explicit role assignments in `user_role_assignments`.
- Cannot create new sites or alter site lifecycle statuses.
- Cross-tenant access attempts return `404 NOT FOUND` to prevent resource existence enumeration.
