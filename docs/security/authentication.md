# Authentication and authorization

Authorization design is in [RBAC](../architecture/rbac.md). This document covers
the authentication decision that Phase 02 must make and the constraints already
fixed.

Status: **not implemented**. Phase 01 has no login, session, or guard.

## Fixed constraints

Regardless of mechanism, authentication must provide:

1. **Server-side session state** that can be revoked. A self-contained token that
   cannot be invalidated is unacceptable for an administrative CMS.
2. **Rotation** of the session identifier on login and on privilege change.
3. **Transport safety**: `HttpOnly`, `Secure` in production, `SameSite=Lax` or
   stricter for cookies; HTTPS-only origins.
4. **CSRF protection** for cookie-authenticated mutations (origin validation plus
   a token).
5. **Throttled, non-enumerating login**: one generic failure message, rate limit,
   and backoff or lockout.
6. **Fail-closed authorization**: inactive users, missing membership, or an
   unknown permission deny access.
7. **Auditability**: successful and failed privileged logins and role changes are
   recorded with request id and IP.

## Options considered

| Option                                    | Strength                                    | Cost / risk                                               |
| ----------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Self-hosted session table + opaque cookie | Full control, revocable, no vendor lock-in  | We own hashing, rotation, CSRF, password reset            |
| Hosted identity provider (OIDC)           | Mature MFA, recovery, less auth code to own | Vendor dependency, free-tier user limits, metadata export |
| JWT access + refresh tokens               | Stateless reads, easy horizontal scaling    | Revocation complexity; tempting to skip server checks     |
| Managed auth library inside Nest          | Faster start, familiar patterns             | Library upgrade churn; still needs our RBAC layer         |

Recommended for Phase 02 (pending approval): a self-hosted session table with
opaque HttpOnly cookies for administrators, because the platform already needs
users, roles, and audit in its own database, and an external provider would
duplicate the identity model. An OIDC provider becomes attractive if MFA or
single sign-on is required before launch.

## Open decisions (require human approval)

1. Session vs OIDC, and the resulting login UX.
2. Password policy and the reset flow (email provider dependency).
3. MFA: required for Super Admin at launch or deferred.
4. Session lifetime, idle timeout, and concurrent-session policy.
5. Whether public sites ever need reader accounts (currently: no).

## What Phase 02 must not do

- Do not trust a role or site claim from the client.
- Do not store tokens in `localStorage` for the admin application.
- Do not implement "remember me" as a long-lived unrevocable token.
- Do not gate a UI without a corresponding server check.
- Do not ship authentication without a denial-path test for cross-site access.

## References

- [RBAC](../architecture/rbac.md)
- [Threat model](../architecture/threat-model.md)
- [Security checklist](security-checklist.md)
- [Secrets](secrets.md)
