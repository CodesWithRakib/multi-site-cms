---
name: security-engineering
description: Enforce platform security baseline including authentication, tenant-scoped authorization (site_id isolation), input validation, and audit logging.
---

# Skill: security-engineering

## Purpose

Enforce the platform's security baseline: authentication, scoped authorization,
input validation, output safety, secret handling, rate limiting, and audit.

## When to use

Any change that touches identity, permissions, site scope, user input, file
upload, headers, CORS, rate limits, secrets, logging, or dependency additions.

## Mandatory rules

1. **Authorize on the server, per request.** Hiding UI is not a control. Every
   site-scoped operation resolves the caller's membership and constrains the
   query by `site_id`.
2. **Never trust client identity claims.** A `siteId`, `role`, or `userId` from a
   request is a lookup key; the authority is the server-side session record.
3. **Fail closed.** Unknown role, missing membership, suspended user, or missing
   session → deny. Never "allow if the check errors".
4. **Validate input, sanitize output.** DTOs reject unknown fields; rich text is
   sanitized on render with an allowlist, never trusted from the editor.
5. **Prevent IDOR by construction.** Fetch tenant resources with both the id and
   the authorized scope in the same query; return 404 rather than 403 when
   revealing existence would leak tenant data.
6. **Secrets stay out of code and the client.** No secret in `NEXT_PUBLIC_*`, no
   `.env` committed, no credentials in logs or error messages. Only
   `.env.example` files are tracked.
7. **Rate limit and cap payloads.** Maintain the global throttle; bound upload
   size, body size, and list page sizes explicitly.
8. **Audit privileged actions.** Creating sites, changing roles, publishing,
   unpublishing, and deleting media append an audit event with actor, scope,
   request id, and IP.
9. **Protect the Super Admin boundary.** Platform role assignment is itself an
   audited, restricted action; no privileged IDs are hardcoded in the frontend.
10. **Dependencies are attack surface.** Add a package only with a documented
    reason, a maintained release line, and no known critical advisory.

## Workflow

1. Identify the assets and actors for the change; read
   `docs/architecture/threat-model.md`.
2. List the trust boundaries the data crosses.
3. Check each boundary: is the value validated, is the actor authorized, is the
   query scoped, is the response free of internal detail?
4. Verify the deny path exists and is tested (wrong site, wrong role, no session).
5. Confirm logging cannot leak secrets or personal data.
6. Update the threat model or security checklist when a control changes.

## Anti-patterns

- `if (user.role === 'super_admin')` scattered in components.
- Authorization in a controller comment: `// TODO: check site access`.
- Trusting `x-forwarded-for` without configured `TRUST_PROXY` for rate limiting.
- A client-side role gate used as the only restriction.
- CSRF-able state change on a cookie-authenticated endpoint with no token/origin
  check.
- Returning the full entity (including internal columns) to every caller.
- Disabling Helmet, CORS allowlists, or the validation pipe to "make it work".

## Review checklist

- [ ] Every new endpoint states its required permission and enforces it.
- [ ] Tenant-scoped queries include the authorized scope.
- [ ] Input validated; output sanitized; errors non-revealing.
- [ ] Secrets handled via environment/secret manager, never committed.
- [ ] Rate limits, body limits, and pagination caps present.
- [ ] Privileged action audited.
- [ ] Deny-path tests exist.

## Project references

- `docs/security/security-checklist.md`
- `docs/architecture/threat-model.md`
- `docs/security/secrets.md`
- `apps/api/src/bootstrap.ts`
- `apps/api/src/common/middleware/request-id.middleware.ts`
