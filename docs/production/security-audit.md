# Production Security Audit & Threat Assessment Report

**Classification**: Confidential Engineering Security Audit  
**Scope**: `apps/api`, `apps/admin`, `apps/sites/travel-blog`, `apps/sites/air-sports`, shared packages  
**Methodology**: Threat modeling, source code static analysis, dynamic API testing, dependency audit

---

## 1. Executive Security Summary

A comprehensive threat-oriented security review was executed across the `multi-site-cms` platform. The architecture enforces defense-in-depth:

- **Server-Side Authorization**: Security boundaries are enforced exclusively on the NestJS backend; client-side UI hiding is treated purely as user experience.
- **Strict Opaque Responses**: Cross-tenant requests, unauthorized queries, and unassigned site access attempts return opaque `404 NOT_FOUND` responses to prevent tenant enumeration and identifier harvesting.
- **Cryptographic Rigor**: Argon2id password hashing, SHA-256 session token hashing, HMAC SHA-256 draft preview signatures, and double-submit anti-CSRF cookies.
- **Zero Raw HTML Injection**: Rich-text bodies from Tiptap are parsed as Abstract Syntax Trees (AST) and rendered as verified React components.

---

## 2. Authentication & Session Security (Section 3.1)

### Cryptographic Password Hashing

- **Algorithm**: Argon2id (OWASP recommended parameter configuration).
- **Parameters**: `memoryCost: 19456` (19 MiB), `timeCost: 2` (2 iterations), `parallelism: 1`, `outputLen: 32`.
- **Implementation**: [`PasswordService`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/services/password.service.ts). Passwords are never logged, stored in plaintext, or compared with naive string equality.

### Session Lifecycle & Cookie Security

- **Opaque Token Generation**: 32-byte cryptographically secure random bytes encoded as base64url (`crypto.randomBytes(32).toString('base64url')`).
- **Token Hashing at Rest**: Raw tokens are hashed using SHA-256 before persisting into the `sessions` table (`token_hash`). If the database is compromised, active session credentials cannot be extracted.
- **Session Expiration & Invalidation**:
  - Absolute Lifetime: 7 days (`SESSION_ABSOLUTE_LIFETIME_MS = 604,800,000 ms`).
  - Idle Timeout: 24 hours (`SESSION_IDLE_TIMEOUT_MS = 86,400,000 ms`).
  - Touch Throttle: Debounced to 5 minutes to prevent write amplification under read-heavy traffic.
- **Cookie Attributes**:
  - `cms_session`: `HttpOnly: true`, `Secure: isProd`, `SameSite: 'lax'`, `Path: '/'`, `MaxAge: 7 days`.
  - `cms_csrf`: `HttpOnly: false` (readable by frontend client script for header attachment), `Secure: isProd`, `SameSite: 'lax'`.
- **Anti-CSRF Defense**: [`CsrfGuard`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/guards/csrf.guard.ts) verifies:
  1. Safe methods (`GET`, `HEAD`, `OPTIONS`) bypass CSRF checks.
  2. State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) with session cookies must present a matching `x-csrf-token` header equal to the cookie value.
  3. `Origin` and `Referer` headers are strictly validated against `CORS_ORIGINS`.

---

## 3. Super Admin & Role-Based Access Control (Section 3.2)

### Privilege Hierarchy

The system defines two primary operational roles:

1. **Super Admin**: Platform developer/owner with platform-wide scope (`scopeType: 'platform'`). Can create sites, assign users, modify system configuration, and inspect audit trails.
2. **Admin**: Client administrator scoped exclusively to explicitly assigned sites (`scopeType: 'site'`, `siteId: UUID`).

### Hardened Privilege Boundaries

- **No HTTP Bootstrap**: Super Admin accounts cannot be bootstrapped via public or authenticated HTTP routes. Bootstrap is executed strictly via operator CLI:
  ```bash
  pnpm --filter @multi-site-cms/api bootstrap:super-admin -- --email "admin@platform.internal" --password "..."
  ```
- **CLI Idempotency & Conflict Refusal**: The bootstrap task refuses execution if a different Super Admin account already exists in the database.
- **Privilege Escalation Prevention**:
  - Client Admins cannot create Super Admins or assign platform-wide roles.
  - Modifying user roles is protected by [`PermissionsGuard`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/guards/permissions.guard.ts) checking `user:manage_roles`.
- **Immutable Audit Logging**: Every privileged operation (creating sites, role modifications, publishing, unpublishing, deleting media) writes an append-only record to `audit_events` with actor ID, IP address, user agent, request correlation ID, and timestamp.

---

## 4. Multi-Site Isolation & Domain Security (Section 3.3)

### Relational Tenant Isolation

- **Composite Constraints**: Relational tables enforce site boundaries at the database level:
  - `post_publications`: `UNIQUE ("site_id", "slug")`, `UNIQUE ("site_id", "post_id")`.
  - `categories`: `FOREIGN KEY ("parent_id", "site_id") REFERENCES "categories" ("id", "site_id")`.
  - `post_publication_media`: `FOREIGN KEY ("publication_id", "site_id") REFERENCES "post_publications" ("id", "site_id")`.
- **No Client Claim Authority**: Caller-supplied `siteId` parameters in query strings or bodies are never treated as authorization. The server resolves memberships from database relations in [`AuthorizationService`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/auth/services/authorization.service.ts).
- **Opaque 404 on Unauthorized Access**: When an Admin attempts to access content, revisions, media, or settings belonging to a site they are not assigned to, the API returns `404 NOT_FOUND` rather than `403 FORBIDDEN`. This completely prevents tenant resource enumeration.

### Domain Registry Security

- **Hostname Normalization**: Strips protocols, paths, query strings, and ports. Normalizes hostnames to lowercase ASCII.
- **Uniqueness Invariant**: Database unique constraint enforces domain uniqueness across all tenants; one site cannot hijack another site's primary domain or alias.
- **Proxy Trust**: Express `trust proxy` is configured strictly via the validated `TRUST_PROXY` integer setting (default `0` in local dev, `1` behind one reverse proxy). Host header spoofing is rejected.

---

## 5. API & Application Security (Section 3.4)

### Input Validation & Transformation

- **NestJS Global ValidationPipe**:
  - `whitelist: true`: Strips unknown properties automatically.
  - `forbidNonWhitelisted: true`: Immediately rejects payloads with undeclared fields (`400 BAD_REQUEST`).
  - `transform: true`: Transforms primitive types safely according to class-validator annotations.
  - `enableImplicitConversion: false`: Prevents type juggling vulnerabilities.
- **Parameterized SQL**: All database operations use TypeORM query builder or parameterized queries (`$1, $2, ...`). Zero raw string concatenation exists in database queries.
- **Error Anonymization**: [`AllExceptionsFilter`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/common/filters/all-exceptions.filter.ts) catches all unhandled exceptions. Internal server errors return `{ code: 'INTERNAL_ERROR', messageKey: 'http.internal' }` along with a correlation `requestId`. Database connection strings, stack traces, and internal file paths never reach clients.

### Rate Limiting & HTTP Headers

- **Global Throttling**: `@nestjs/throttler` enforces a rate limit of 120 requests per 60 seconds per IP across all endpoints.
- **Security Headers (Helmet)**:
  - `X-Frame-Options: DENY`: Complete clickjacking protection.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `X-DNS-Prefetch-Control: off`.
  - `Cross-Origin-Opener-Policy: same-origin`.
  - `Cross-Origin-Resource-Policy: same-origin`.

---

## 6. Content Rendering & Media Upload Security (Section 3.5)

### Safe Document AST Rendering

- **Prohibition of `dangerouslySetInnerHTML`**: Public web applications (`apps/sites/travel-blog` and `apps/sites/air-sports`) prohibit `dangerouslySetInnerHTML` on article bodies.
- **Structural Node Mapping**: Content is received as a JSON document tree. Every node (`heading`, `paragraph`, `table`, `eventTimelineBlock`, `calloutBlock`) is mapped directly to a typed React element.
- **Protocol Allowlist**: Links and image sources reject dangerous schemes (`javascript:`, `data:`, `vbscript:`, `file:`). Only `http:`, `https:`, and relative paths are permitted.

### Media Upload Hardening

- **Server-Side Magic Byte Verification**: [`validateAndInspectFile`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/media/utils/file-validator.ts) inspects binary headers to detect file disguises (e.g. executable renamed to `.png`).
- **Strict MIME Allowlist**: Only approved image, video, audio, and PDF types are accepted.
- **SVG Sanitization**: SVG uploads are parsed and sanitized using [`sanitizeSvg`](file:///C:/Sofof_tech_2026/multi-site-cms/apps/api/src/media/utils/file-validator.ts), which strips `<script>`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, inline event handlers (`onload`, `onclick`), and `javascript:` URLs.

---

## 7. Secrets & Dependency Audit (Section 3.6)

### Secrets Management

- **Zero Committed Credentials**: Git tracking checks confirm zero `.env` files are committed. Only `.env.example` templates exist in the repository.
- **Client Bundle Isolation**: Only public configuration variables prefixed with `NEXT_PUBLIC_*` are accessible to frontend code. No database connection strings, HMAC signing keys, or server secrets exist in client bundles.

### Dependency Vulnerability Audit (`pnpm audit`)

- **Result**: Zero high or critical vulnerabilities exist in runtime production packages.
- **Dev-Dependency Notice**: 3 development-only advisories exist in the `ts-jest` / `jest` test runner dependency tree (`minimatch`, `glob`, `deepmerge`). None of these libraries are bundled into production build outputs or API runtime containers.

---

## 8. Threat Matrix Summary

| Threat Vector                  | Mitigating Control                                      | Verification Test                     |
| :----------------------------- | :------------------------------------------------------ | :------------------------------------ |
| **Credential Brute-Force**     | Argon2id slow hashing + ThrottlerGuard 120 req/min      | `auth.e2e-spec.ts`                    |
| **Session Fixation**           | Previous session revoked upon login (`oldSessionToken`) | `session.service.ts`                  |
| **Cross-Site Request Forgery** | Double-submit cookie + CORS origin verification         | `csrf.guard.spec.ts`                  |
| **Cross-Tenant IDOR**          | Server-side role resolution + composite site query      | `rbac-and-site-isolation.e2e-spec.ts` |
| **Stored XSS**                 | Tiptap AST node mapping without raw HTML injection      | `DocRenderer.test.tsx`                |
| **Malicious File Upload**      | Binary magic-byte checking + SVG element stripping      | `media-upload.e2e-spec.ts`            |
| **Draft Preview Forgery**      | HMAC SHA-256 signature verification with expiry         | `public-content.e2e-spec.ts`          |
| **Information Disclosure**     | Generic error envelopes with sanitized stack traces     | `errors.e2e-spec.ts`                  |
