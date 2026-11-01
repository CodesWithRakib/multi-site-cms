# ADR-0016: Session-based authentication and role-based authorization

- Status: Accepted
- Date: 2026-11-01
- Owners: Security & Backend Architecture

## Context

The `multi-site-cms` platform requires a centralized administrative dashboard (`apps/admin`) that manages multiple independent public websites (`travel-blog`, `air-sports`). Two fundamental privilege levels exist:

1. **Super Admin**: Platform owner/developer with global authority over all websites, users, role assignments, and platform settings.
2. **Admin**: Client users strictly restricted to explicitly assigned websites and granted permissions.

Security invariants:

- **Instant Revocation**: Compromised accounts or deactivated users must be invalid immediately across all active browser sessions.
- **Fail-Closed RBAC**: Actions are evaluated against granular permissions, not role strings.
- **Tenant Isolation & IDOR Prevention**: Site Admins attempting to query or mutate another site's private resources must receive a 404 NOT FOUND to eliminate tenant resource existence leakage.
- **Defense in Depth**: Defense against credential enumeration, brute-force password guessing, timing attacks, session fixation, and CSRF attacks.

## Decision

We implement a server-side session persistence model with cryptographically secure opaque cookies and database-backed dynamic RBAC:

### 1. Password Hashing & Account Security

- Passwords are encrypted with **Argon2id** (memory: 64MB, iterations: 3, parallelism: 4) using `@node-rs/argon2`.
- Timing attack mitigation: when an unknown email is submitted, a dummy Argon2 hash is verified against the input password to ensure constant-time response.
- Progressive lockout: 5 consecutive failed login attempts lock the account for 15 minutes (`locked_until` in PostgreSQL).
- Inactive (`status != 'active'`) accounts fail closed.

### 2. Session Architecture

- Opaque, cryptographically random 32-byte tokens (`crypto.randomBytes(32)`).
- Raw session tokens are never stored in the database. The database stores the hex-encoded **SHA-256 hash** (`token_hash`) with a unique constraint.
- Transport: `cms_session` cookie with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` (enforced when `NODE_ENV=production`).
- Lifecycle: 7-day absolute lifetime, 24-hour idle timeout. Last active timestamp updates are debounced by 5 minutes to minimize database writes.
- Fixation defense: Sessions are rotated upon successful authentication and privilege escalation.
- Revocation: Individual logout destroys the specific session row; account deactivation or password change revokes all user sessions.

### 3. CSRF Protection

- Double Submit Cookie pattern implemented in `CsrfGuard`.
- A cryptographically random `cms_csrf` cookie is set alongside the session.
- All state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) carrying a session cookie must present a matching `X-CSRF-Token` header.
- Origin/Referer header verification enforces cross-origin isolation.

### 4. RBAC & Site-Level Authorization

- Granular permissions modeled in `permissions` and `role_permissions` (`site:read`, `site:update_settings`, `user:read`, `user:manage`, `role:assign`, etc.).
- Platform vs. Site scope: Super Admin role has `scope_type = 'platform'` and `site_id IS NULL`. Admin role has `scope_type = 'site'` with explicit `user_role_assignments.site_id`.
- Policy enforcement: Centralized in `AuthorizationService`. Super Admin possesses platform-wide bypass for all sites. Site Admins require both the specific permission and an active membership for the requested `site_id`.
- IDOR Prevention: `SiteAccessGuard` and `AuthorizationService.canAccessSite()` return `404 NOT FOUND` instead of `403 FORBIDDEN` when a client Admin accesses a foreign site.
- Protection of the Super Admin boundary: Deactivation or demotion of the last active Super Admin is prohibited and rejected with `400 BAD REQUEST`.

## Alternatives considered

| Option                               | Why not                                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stateless JWTs                       | Cannot be revoked immediately without maintaining a distributed denylist, violating the instant revocation requirement for compromised admin accounts. |
| Bearer tokens in localStorage        | Vulnerable to credential theft via cross-site scripting (XSS).                                                                                         |
| Third-party OIDC / Auth0             | Introduces external SaaS dependency, cost at scale, and duplicates the existing schema's `users` and `roles` tables.                                   |
| Hardcoded role checks in controllers | Violates future extensibility; prevents adding future roles (`editor`, `author`) without rewriting handlers.                                           |

## Consequences

- Server-side state requires one database lookup per authenticated request (optimized by unique index on `token_hash` and indexed user/roles relations).
- Strict CSRF protection requires client-side callers (Next.js admin) to pass `X-CSRF-Token` on mutations.
- Adding future roles requires only adding database rows into `roles` and `role_permissions`, with zero changes to existing controllers or guards.
