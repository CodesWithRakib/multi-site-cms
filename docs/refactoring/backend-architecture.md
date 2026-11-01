# Backend Architecture & API Engineering Standards

**Date:** 2026-11-01  
**Target Application:** `apps/api` (Modular Monolith API)  
**Framework:** NestJS 11, Fastify, TypeORM, PostgreSQL 18

---

## 1. Modular Monolith Architecture

`apps/api` is structured as a modular monolith. Each domain module encapsulates its own controllers, services, entities, and repositories while respecting strict boundary isolation:

```
apps/api/src/
├── auth/           # Authentication, session cookies, RBAC guards
├── sites/          # Site registry, custom domains, settings
├── content/        # Canonical posts, revisions, publications, status transitions
├── taxonomy/       # Site-scoped categories, tags, hierarchical trees
├── media/          # Asset metadata, upload processing, disk storage abstraction
├── publishing/     # Scheduled publishing engine, transactional outbox, worker
├── realtime/       # Server-Sent Events (SSE) live updates
├── system/         # Liveness/readiness health probes, system stats
└── audit/          # Security event logger, immutable audit records
```

### Module Boundary Rules:

1. Controllers must remain **thin**: validate inputs via DTOs, delegate business logic to services, and return typed data.
2. Cross-module operations must go through service interfaces, never by querying another module's TypeORM repository directly.
3. Database entities are owned by their respective modules.

---

## 2. Multi-Tenant Isolation & Site Scoping

Every query and mutation targeting site-scoped resources (posts, taxonomy, publications, media) must enforce cryptographic or relational isolation:

1. **Mandatory `site_id` Constraints**:
   - Every site-scoped entity table contains a `site_id: string (uuid)` column with a foreign key referencing `sites(id) ON DELETE CASCADE`.
   - All repository `find`, `update`, and `delete` calls must include `where: { siteId, ... }` in their query criteria.
2. **Authorization Guards**:
   - `AuthGuard`: Validates session cookie or bearer token.
   - `PermissionsGuard`: Validates required platform role or site-level permission (`SitePermission.CAN_MANAGE_POSTS`, etc.).
   - If a caller attempts to access a resource belonging to a site they do not have membership in, the server returns an opaque `404 NOT_FOUND` rather than `403` to prevent tenant resource enumeration.

---

## 3. Standardized Response Envelope & Error Contract

All HTTP responses conform strictly to the shared envelope defined in `@multi-site-cms/types`:

### 3.1 Success Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01hxyz...",
    "timestamp": "2026-11-01T20:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "totalPages": 8
    }
  }
}
```

### 3.2 Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided publication payload contains invalid fields",
    "details": [
      {
        "field": "slug",
        "message": "Slug must contain only lowercase alphanumeric characters and dashes"
      }
    ],
    "requestId": "req_01hxyz..."
  }
}
```

---

## 4. Database Reliability & Migrations

1. **`synchronize: false` Mandate**:
   - Automatic schema synchronization is strictly forbidden in all environments (development, staging, production).
   - Schema modifications are executed solely through reviewed, numbered TypeORM migration scripts (`apps/api/src/migrations/*.ts`).
2. **Transaction Isolation**:
   - Multi-step operations (e.g., publishing a post, recording an outbox event, and updating audit log) must run inside a single TypeORM transaction (`dataSource.transaction(...)`).
3. **Optimistic Locking**:
   - Revisions use an incrementing `version` number to prevent lost updates during concurrent edits.
