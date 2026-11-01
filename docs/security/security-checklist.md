# Security baseline and review checklist

Use this before merging anything that touches identity, tenant data, input,
headers, or infrastructure. Phase 01 status is marked per item so no control is
described as implemented when it is not.

## Transport and headers

| Control                                            | Status | Where                                  |
| -------------------------------------------------- | ------ | -------------------------------------- |
| Helmet defaults on the API                         | ✅ 01  | `apps/api/src/bootstrap.ts`            |
| `x-powered-by` disabled                            | ✅ 01  | `bootstrap.ts`                         |
| Explicit CORS allowlist, credentials allowed       | ✅ 01  | `CORS_ORIGINS` env                     |
| `X-Content-Type-Options: nosniff`                  | ✅ 01  | API + web headers module               |
| `X-Frame-Options: DENY`                            | ✅ 01  | web headers module                     |
| `Referrer-Policy: strict-origin-when-cross-origin` | ✅ 01  | web headers module                     |
| `Permissions-Policy` restrictive                   | ✅ 01  | web headers module                     |
| HSTS                                               | ⏳ 02  | Must be set by the HTTPS platform/CDN  |
| Content-Security-Policy                            | ⏳ 02  | After the third-party surface is known |

## Input and output

| Control                                        | Status | Where                               |
| ---------------------------------------------- | ------ | ----------------------------------- |
| DTO validation with whitelist + reject unknown | ✅ 01  | `ValidationPipe`                    |
| URL schemes restricted to HTTP(S)              | ✅ 01  | `validation`, `config`              |
| Request ID bounded and validated               | ✅ 01  | `request-id.middleware.ts`          |
| Body size limits                               | ✅ 03  | `BODY_LIMIT` on JSON and urlencoded |
| Pagination caps                                | ⏳ 05  | With the first list endpoint        |
| Rich-text sanitization with an allowlist       | ⏳ 02  | Before rendering user HTML          |
| Error messages free of stack traces and SQL    | ✅ 01  | `all-exceptions.filter.ts`          |

## Authentication and authorization

| Control                             | Status | Where                           |
| ----------------------------------- | ------ | ------------------------------- |
| Server-side session authentication  | ⏳ 02  | Not implemented                 |
| Role and permission enforcement     | ⏳ 02  | [RBAC](../architecture/rbac.md) |
| Site-scoped object authorization    | ⏳ 02  | Guard + scoped query            |
| CSRF defense (origin + token)       | ⏳ 02  | Before cookie-auth mutations    |
| Login throttling and lockout        | ⏳ 02  | Login module                    |
| Last-Super-Admin protection         | ⏳ 02  | Role service                    |
| Audit events for privileged actions | ⏳ 02  | Audit module                    |

## Secrets and configuration

| Control                                  | Status | Where                        |
| ---------------------------------------- | ------ | ---------------------------- |
| Only `.env.example` tracked              | ✅ 01  | `.gitignore`                 |
| Public env limited to `NEXT_PUBLIC_*`    | ✅ 01  | `config`, env examples       |
| API env validated at startup, fails fast | ✅ 01  | `apps/api/src/config/env.ts` |
| Production refuses development defaults  | ✅ 03  | `parseEnv` guards            |
| Logs redact secrets and omit bodies      | ✅ 03  | `json-logger.ts`             |
| No secrets in client bundles or logs     | ✅ 01  | Review rule                  |
| Secret rotation documented               | ⏳ 02  | [secrets.md](secrets.md)     |

## Abuse resistance

| Control                                  | Status | Where                     |
| ---------------------------------------- | ------ | ------------------------- |
| Global rate limit (120/min/IP)           | ✅ 01  | `@nestjs/throttler`       |
| Trust proxy explicitly configured        | ✅ 01  | `TRUST_PROXY`             |
| Health endpoint non-cacheable            | ✅ 01  | `Cache-Control: no-store` |
| Shared rate-limit store across instances | ⏳ 02  | Only if instances > 1     |

## Pre-merge checklist

- [ ] Every new endpoint names its permission and enforces it server-side.
- [ ] Every tenant-scoped query includes the authorized site scope.
- [ ] Every new input has a DTO; unknown fields are rejected.
- [ ] No secret, token, hostname, or personal data added to the repository.
- [ ] No `NEXT_PUBLIC_*` variable carries sensitive data.
- [ ] Error paths return the envelope with a non-revealing message.
- [ ] Denial-path tests exist (wrong site, wrong role, no session).
- [ ] New dependency justified and checked for advisories.
- [ ] Threat model or this checklist updated if a control changed.

## Reporting a vulnerability

Do not open a public issue. Contact the project owner with reproduction steps,
affected endpoint or page, and impact. Do not include live credentials or third
party personal data. The owner records the fix and the follow-up control in the
threat model.

## References

- [Threat model](../architecture/threat-model.md)
- [RBAC](../architecture/rbac.md)
- [Secrets](secrets.md)
