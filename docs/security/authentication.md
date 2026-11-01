# Authentication and session management

Status: **Implemented** (Phase 04).

This document covers the production authentication foundation for `multi-site-cms`.

## Architecture overview

Authentication uses server-side sessions stored in PostgreSQL and delivered to browsers via secure, opaque `HttpOnly` cookies.

```
+-----------------------------------------------------------------------------------------+
|                                    Next.js Admin Shell                                  |
+-----------------------------------------------------------------------------------------+
       |                                                    ^
       | POST /api/v1/auth/login                            | Set-Cookie: cms_session=...; HttpOnly
       | { email, password }                                | Set-Cookie: cms_csrf=...
       v                                                    |
+-----------------------------------------------------------------------------------------+
|                                      NestJS API                                         |
|                                                                                         |
| 1. Normalize email & verify active status                                               |
| 2. Check account lockout (locked_until > NOW())                                         |
| 3. Argon2id password verification (with constant-time dummy verify on unknown accounts) |
| 4. Generate cryptographically random 32-byte session token                              |
| 5. Compute SHA-256 hash and persist to sessions table                                   |
| 6. Set rotated cookies and audit event                                                  |
+-----------------------------------------------------------------------------------------+
       |
       v SQL: INSERT INTO sessions (user_id, token_hash, expires_at)
+-----------------------------------------------------------------------------------------+
|                                    PostgreSQL 18                                        |
+-----------------------------------------------------------------------------------------+
```

## Security controls and implementation

### 1. Password security

- **Algorithm**: Argon2id via `@node-rs/argon2`.
- **Parameters**: Memory: 64 MB (`65536` KiB), Iterations: 3, Parallelism: 4.
- **Plaintext hygiene**: Plaintext passwords exist in memory only during credential verification and are never persisted or logged.
- **Response sanitization**: User entities and API responses never contain `passwordHash`.

### 2. Session lifecycle and storage

- **Session Tokens**: 32 cryptographically random bytes generated via `crypto.randomBytes(32)` formatted as a 64-character hex string.
- **Storage**: Raw session tokens are never stored in the database. The database stores the SHA-256 hash (`token_hash`) in the `sessions` table.
- **Constraints**: `UQ_sessions_token_hash` enforces unique token hashes; foreign key `FK_sessions_user` links to `users.id` with `ON DELETE CASCADE`.
- **Lifetimes**:
  - **Absolute Expiration**: 7 days from initial session creation (`expires_at`).
  - **Idle Expiration**: 24 hours of inactivity (`last_active_at + interval '24 hours'`).
  - **Activity Debounce**: `last_active_at` updates are debounced by 5 minutes to prevent write amplification.
- **Session Rotation**: Session tokens are replaced upon every successful login to eliminate session fixation risks.
- **Revocation**:
  - `POST /api/v1/auth/logout`: Revokes the specific active session and clears client cookies.
  - User Deactivation / Password Change: Revokes all sessions belonging to the user (`DELETE FROM sessions WHERE user_id = :userId`).

### 3. Account lockout and brute force defense

- **Consecutive Failures**: Monitored via `users.failed_login_count`.
- **Lockout Threshold**: 5 consecutive failed attempts trigger an immediate 15-minute lockout (`users.locked_until = NOW() + 15 minutes`).
- **Timing Mitigation**: If an unregistered email is submitted, the authentication service executes a dummy Argon2id hash verification against a pre-computed hash to equalize response latency and prevent user enumeration.
- **Rate Limiting**: NestJS `@Throttle({ default: { limit: 5, ttl: 60000 } })` limits login attempts to 5 per minute per IP address.

### 4. CSRF protection

- **Mechanism**: Double Submit Cookie pattern enforced globally via `CsrfGuard`.
- **Cookie**: `cms_csrf` cookie generated with 24 random bytes (`SameSite=Lax`, `Path=/`, non-HttpOnly so client-side JavaScript can read it).
- **Header**: Mutations (`POST`, `PUT`, `PATCH`, `DELETE`) carrying a `cms_session` cookie must supply an identical value in the `X-CSRF-Token` header.
- **Origin Validation**: State-changing requests verify that `Origin` or `Referer` matches the configured `CORS_ORIGINS` allowlist.

### 5. Transport and cookie properties

| Property   | Value                         | Purpose                                                               |
| ---------- | ----------------------------- | --------------------------------------------------------------------- |
| `HttpOnly` | `true`                        | Prevents XSS scripts from reading the session cookie                  |
| `Secure`   | `true` (prod) / `false` (dev) | Ensures session cookie is only sent over HTTPS                        |
| `SameSite` | `Lax`                         | Mitigates CSRF on top-level navigations while permitting normal links |
| `Path`     | `/`                           | Confines session to API and admin scope                               |

## Localization support

Authentication and authorization error messages are fully internationalized in English (`en`) and Bangla (`bn`) via `apps/api/src/common/i18n/messages.ts`, responding based on `Accept-Language` headers.

## References

- [ADR-0016: Session-based authentication and RBAC](../adr/0016-session-based-authentication-and-rbac.md)
- [Authorization and RBAC](authorization.md)
- [Super Admin bootstrap](super-admin-bootstrap.md)
- [Authentication threat model](auth-threat-model.md)
