# Authorization model: Super Admin, Admin, and future roles

Status: **Implemented in Phase 04** (Authentication, RBAC & Site Authorization).

## Roles versus permissions

Roles are named bundles of permissions; authorization checks permissions, never
role names. This is what lets the platform add Editor and Author later without
editing every handler.

| Role          | Scope    | Purpose                                     |
| ------------- | -------- | ------------------------------------------- |
| `super_admin` | platform | Platform owner. All sites, users, roles.    |
| `admin`       | site     | Client account. Assigned one or more sites. |
| `editor`      | site     | Future. Reviews and publishes site content. |
| `author`      | site     | Future. Creates drafts on assigned sites.   |

`roles.scope_type` is `platform` or `site`. A site-scoped assignment carries a
`site_id`; a platform-scoped assignment has `site_id IS NULL`. A unique index on
`(user_id, role_id, site_id) NULLS NOT DISTINCT` prevents duplicate grants.

## Permission matrix

Legend: ✅ allowed, ➖ not applicable, 🔒 requires explicit Super Admin action.

| Permission               | Super Admin | Admin (assigned site) |
| ------------------------ | ----------- | --------------------- |
| `site:read`              | all sites   | assigned sites        |
| `site:update_settings`   | ✅          | ✅ allowlisted keys   |
| `site:create` / `delete` | ✅          | ➖                    |
| `domain:manage`          | ✅          | ➖                    |
| `user:read`              | ✅          | ➖                    |
| `user:manage`            | ✅          | ➖                    |
| `role:assign`            | ✅          | ➖                    |
| `post:read`              | all sites   | assigned sites        |
| `post:create`            | ✅          | ✅                    |
| `post:update`            | ✅          | ✅                    |
| `post:delete`            | ✅          | ➖ (archive only)     |
| `publication:publish`    | ✅          | ✅                    |
| `publication:schedule`   | ✅          | ✅                    |
| `publication:archive`    | ✅          | ✅                    |
| `taxonomy:manage`        | ✅          | assigned sites        |
| `media:upload`           | ✅          | assigned sites        |
| `media:delete`           | ✅          | assigned sites        |
| `audit:read`             | all         | ➖                    |
| `platform:configure`     | ✅          | ➖                    |

## Admin UI visibility

The admin hides what a caller cannot use; this is cosmetic, the API enforces
every rule above. The sidebar and route guards use these checks:

| Screen / control                          | Shown when                  |
| ----------------------------------------- | --------------------------- |
| Content, Engagement, Help sections        | any signed-in user          |
| Websites (`/sites`)                       | Super Admin                 |
| User Management (`/users`)                | `user:read`                 |
| Settings (`/settings`)                    | `platform:configure`        |
| Activity Logs (`/audit-logs`)             | `audit:read`                |
| Delete post / delete comment              | `post:delete` (Super Admin) |
| Dashboard "System Status", `/sites` links | Super Admin                 |

`GET /publishing/health` needs `publication:publish`, and its queue sizes
(scheduled, outbox backlog, dead letters) are scoped to the caller's authorized
sites; only a Super Admin sees the whole platform. Another tenant's queue size
is tenant data.

Tags are managed on the Categories & Tags screen (`/taxonomy`), not a separate
route. Site-scoped permissions are not visible to `can(permission)` without a
site id, so platform screens never appear for a site-scoped Admin.

"Limited keys" means a site-settings allowlist. An Admin must not be able to
change a setting that affects billing, storage scope, or cross-site publishing.

## Enforcement points

1. **Authentication** produces a server-side session identifying one user.
   Client-stored role claims are never authority.
2. **Site context** is resolved per request. Admin routes are shaped
   `/sites/:siteId/...`; the guard verifies an active membership for that user
   and site before the handler runs.
3. **Query scoping** is independent of the guard. Even after the guard passes,
   the query includes `site_id` so a bug cannot widen the result set.
4. **Object-level checks** compare the loaded row's `site_id` to the resolved
   context. Loading by primary key alone is forbidden.
5. **Action-level checks** ask for the permission key, e.g. `publication:publish`,
   not the role.
6. **Audit** records platform-level and publication-level actions with actor,
   site, request id, and IP.

Return **404** for a resource that exists in another tenant; returning 403 would
confirm its existence.

## Super Admin protection

- The first Super Admin is created by a one-time bootstrap procedure, not by the
  public admin UI.
- Granting or revoking `super_admin` is a privileged operation requiring an
  existing Super Admin, an audit event, and (recommended) re-authentication.
- A Super Admin cannot demote or disable the last remaining Super Admin.
- Platform-level screens are additional UI for a Super Admin, never the security
  boundary.
- No privileged user IDs appear in frontend code or configuration.

## Sessions and tokens

Phase 02 selects one mechanism; the constraints are fixed now:

- Cookie-based sessions are `HttpOnly`, `Secure` in production, and
  `SameSite=Lax` at minimum. A session identifier is opaque and rotated on
  privilege change.
- State-changing cookie-authenticated requests require CSRF defense: origin
  validation plus a token, not one alone.
- Session expiry, idle timeout, and server-side revocation exist from day one.
- Suspended or disabled users fail closed even if a session row still exists.

The exact mechanism is an open decision; see
[authentication](../security/authentication.md).

## Threat considerations

| Risk                                  | Control                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| Privilege escalation via role payload | Role/permission assignment restricted to Super Admin    |
| IDOR on tenant resources              | Guard + `site_id`-scoped query + object ownership check |
| Hidden-UI-only protection             | All checks server-side; UI state is cosmetic            |
| Session fixation                      | Rotate session id on login and privilege change         |
| CSRF on cookie auth                   | Origin validation plus anti-CSRF token                  |
| Enumeration of other tenants' content | 404 instead of 403; scoped list endpoints               |
| Stale authorization after demotion    | Re-resolve membership per request; short session cache  |

## Future roles

Editor and Author are additional `roles` rows with subsets of the site-scoped
permissions and, for Editor, an approval step on publications. No new table and
no new guard type is required. See
[ADR 0003](../adr/0003-single-api-and-site-context.md).

## References

- [ERD](erd.md) — `roles`, `permissions`, `user_role_assignments`.
- [Threat model](threat-model.md)
- [Security checklist](../security/security-checklist.md)
- [Multi-site content model](multi-site-content-model.md)
