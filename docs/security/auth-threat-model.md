# Authentication and authorization threat model

Status: **Current** (Phase 04).

## Scope

This document analyzes identity, session, and authorization threats against the `multi-site-cms` administrative API and multi-tenant boundary.

## Threat matrix

| Threat                                         | Likelihood | Impact   | Primary Control                                                                                                             | Secondary Defense                                                                    | Verification                                                                                     |
| ---------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| **Credential stuffing / Brute-force guessing** | High       | High     | Account lockout after 5 consecutive failures for 15 minutes (`users.locked_until`).                                         | IP rate limiting via `@Throttle(5/min)` and strong password policy (min 12 chars).   | `apps/api/test/api/auth.e2e-spec.ts`                                                             |
| **User enumeration / Timing attacks**          | Medium     | Low      | Identical generic error response (`auth.invalidCredentials`) and constant-time dummy Argon2 verification on unknown emails. | Strict non-disclosure of user existence on failed login.                             | `apps/api/test/api/auth.e2e-spec.ts`                                                             |
| **Session theft via XSS**                      | Medium     | Critical | `HttpOnly` flag on `cms_session` cookie blocks all JavaScript access.                                                       | Content Security Policy and input sanitization.                                      | `apps/api/test/api/auth.e2e-spec.ts`                                                             |
| **Session sniffing in transit**                | Low        | Critical | `Secure` cookie flag in production environment; HTTPS termination.                                                          | HSTS headers in production config.                                                   | Verified via cookie flags in config & tests                                                      |
| **Session fixation**                           | Medium     | High     | Session rotation: every successful login generates a new session identifier and revokes the old one.                        | Strict cookie pathing and validation.                                                | `apps/api/test/api/auth.e2e-spec.ts`                                                             |
| **Cross-Site Request Forgery (CSRF)**          | Medium     | High     | Double Submit Cookie pattern: `cms_csrf` cookie + `X-CSRF-Token` header validation in `CsrfGuard`.                          | Origin and Referer validation against allowlisted CORS origins.                      | `apps/api/test/unit/csrf.guard.spec.ts`, `apps/api/test/api/rbac-and-site-isolation.e2e-spec.ts` |
| **Cross-tenant IDOR / Resource enumeration**   | High       | High     | Server-side site membership check via `SiteAccessGuard` + returning `404 NOT FOUND` instead of `403`.                       | Database queries enforce `site_id` filtering unconditionally.                        | `apps/api/test/api/rbac-and-site-isolation.e2e-spec.ts`                                          |
| **Privilege escalation via body tampering**    | High       | Critical | Strict DTO validation with `class-validator` and `whitelist: true`; controllers reject unpermitted role assignments.        | Server derives principal solely from verified session, never from request payload.   | `apps/api/test/api/rbac-and-site-isolation.e2e-spec.ts`                                          |
| **Self-promotion to Super Admin**              | Medium     | Critical | `role:assign` and `user:manage` permissions are required for role management, restricted exclusively to Super Admins.       | Invariant check prevents non-super admins from assigning `super_admin`.              | `apps/api/test/api/rbac-and-site-isolation.e2e-spec.ts`                                          |
| **Stale session after user deactivation**      | Medium     | High     | Deactivating a user immediately triggers bulk session revocation (`DELETE FROM sessions WHERE user_id = :id`).              | `AuthGuard` re-verifies that `user.status === 'active'` on every request.            | `apps/api/test/api/auth.e2e-spec.ts`                                                             |
| **Sole Super Admin lockout / Destruction**     | Low        | Critical | Invariant check in `UsersService` rejects deactivation or removal of the last active Super Admin with `400 BAD REQUEST`.    | Disaster recovery CLI bootstrap allows password rotation without schema destruction. | `apps/api/test/api/rbac-and-site-isolation.e2e-spec.ts`                                          |
| **Database compromise / Hash exfiltration**    | Low        | High     | Raw session tokens are never saved; database stores SHA-256 `token_hash`. Passwords hashed with high-cost Argon2id.         | DB connection least privilege and restricted network access.                         | `apps/api/test/database/schema.integration-spec.ts`                                              |

## Residual risks and future mitigations

1. **Multi-Factor Authentication (MFA)**:
   - _Status_: Deferred to a dedicated phase.
   - _Mitigation_: Mitigated by strict rate limiting, progressive account lockout, and robust password requirements.
2. **Session Hijacking via Stolen Cookies**:
   - _Status_: Cookies cannot be read by JavaScript (`HttpOnly`), but could be compromised if an endpoint device is infected with malware.
   - _Mitigation_: 24-hour idle timeout, 7-day absolute expiration, and single-click session invalidation.

## References

- [ADR-0016: Session-based authentication and RBAC](../adr/0016-session-based-authentication-and-rbac.md)
- [Authentication and session management](authentication.md)
- [Role-based access control and authorization](authorization.md)
