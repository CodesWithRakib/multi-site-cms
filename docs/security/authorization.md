# Role-based access control and site-level authorization

Status: **Implemented** (Phase 04).

## Authorization model

The `multi-site-cms` authorization layer decouples roles from handlers. Handlers enforce granular permissions, while roles serve as administrative bundles of permissions.

```
+------------------+         +-----------------------+         +-------------------+
|      users       | <------ | user_role_assignments | ------> |       roles       |
+------------------+         +-----------------------+         +-------------------+
                                   | site_id (or NULL)                   |
                                   v                                     v
                             +-----------+                     +-------------------+
                             |   sites   |                     | role_permissions  |
                             +-----------+                     +-------------------+
                                                                         |
                                                                         v
                                                               +-------------------+
                                                               |    permissions    |
                                                               +-------------------+
```

### Roles and scopes

| Role          | Scope type | Target             | Description                                                                                     |
| ------------- | ---------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `super_admin` | `platform` | `site_id IS NULL`  | Platform owner. Unrestricted access across all sites, platform users, and global configuration. |
| `admin`       | `site`     | `site_id = <UUID>` | Site administrator. Restricted to assigned site(s) and assigned permissions.                    |
| `editor`      | `site`     | `site_id = <UUID>` | Future role: reviews, edits, and publishes content on assigned sites.                           |
| `author`      | `site`     | `site_id = <UUID>` | Future role: drafts content on assigned sites.                                                  |

## Permission catalog

Permissions follow a hierarchical `resource:action` convention:

| Permission             | Scope    | Target       | Purpose                                        |
| ---------------------- | -------- | ------------ | ---------------------------------------------- |
| `site:read`            | Site     | Sites        | View site metadata, configuration, and status  |
| `site:update_settings` | Site     | Sites        | Update allowlisted site configuration settings |
| `site:create`          | Platform | Sites        | Provision a new site within the platform       |
| `site:delete`          | Platform | Sites        | Remove an existing site                        |
| `user:read`            | Platform | Users        | List and inspect platform users                |
| `user:manage`          | Platform | Users        | Create, update, activate, and deactivate users |
| `role:assign`          | Platform | RBAC         | Assign and revoke roles and site associations  |
| `content:read`         | Site     | Posts        | View posts and revisions                       |
| `content:create`       | Site     | Posts        | Create post drafts                             |
| `content:update`       | Site     | Posts        | Modify post revisions                          |
| `content:publish`      | Site     | Publications | Publish posts to a specific site               |
| `media:upload`         | Site     | Media        | Upload media assets for an assigned site       |
| `audit:read`           | Platform | Audit        | Read append-only platform audit logs           |

## Centralized authorization service (`AuthorizationService`)

Authorization is strictly evaluated server-side. Handlers and guards delegate to `AuthorizationService`:

1. **Context Resolution**: Resolves the user's active status, platform role, effective permissions (deduplicated across all assignments), and authorized site IDs.
2. **Super Admin Policy**: Super Admins automatically satisfy site access checks platform-wide.
3. **Site Admin Policy**: A Site Admin must satisfy two independent checks:
   - Must possess the required permission in their effective permissions.
   - Must possess an active assignment for the target `siteId`.

### IDOR defense and tenant resource leakage prevention

When a Site Admin attempts to access or mutate a site ID or resource ID to which they are not assigned:

- **Requirement**: Return **404 NOT FOUND** (NOT 403 Forbidden).
- **Security Rationale**: Returning 403 confirms that the foreign resource or tenant exists, enabling enumeration and reconnaissance. Returning 404 ensures cross-tenant resources are completely invisible.

### Invariant: Protection of the Super Admin boundary

1. **Sole Super Admin Invariant**: The system prohibits deactivating or revoking the Super Admin role from the last active Super Admin on the platform. Any attempt is rejected with `400 BAD REQUEST`.
2. **Elevation Restriction**: Ordinary Admins cannot assign roles, promote accounts to Super Admin, or modify platform role mappings. Routes require `role:assign` or `user:manage`, which are exclusive to Super Admins.
3. **Self-Promotion Denial**: Any role assignment attempt by an ordinary Admin fails with `403 FORBIDDEN`.

## Guards and decorators

- `@Public()`: Bypasses authentication for public endpoints (e.g. `/api/v1/auth/login`, health checks).
- `@RequirePermissions(...permissions)`: Enforces that the authenticated user possesses all specified permissions via `PermissionsGuard`.
- `@RequireSiteContext()`: Validates that the request's `:siteId` parameter belongs to the user's authorized sites via `SiteAccessGuard`.
- `@CurrentUser()`: Extracts the validated `EffectiveAuthContext` from the request.

## References

- [ADR-0016: Session-based authentication and RBAC](../adr/0016-session-based-authentication-and-rbac.md)
- [Authentication and session management](authentication.md)
- [Architecture RBAC specification](../architecture/rbac.md)
