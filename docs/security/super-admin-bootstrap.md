# Super Admin provisioning and bootstrap procedure

Status: **Implemented** (Phase 04).

## Purpose

The initial provisioning of the platform's Super Admin must occur securely without hardcoded credentials in source control or seeds, and without exposing an unauthenticated privilege-escalation endpoint over HTTP.

## Operational procedure

Super Admin bootstrap is executed exclusively via an operator CLI command running in the deployment environment:

```bash
pnpm --filter @multi-site-cms/api bootstrap:super-admin \
  --email "admin@sofoftech.com" \
  --password "YourStrongPassword123!" \
  --display-name "Platform Developer"
```

Alternatively, values can be provided through environment variables (e.g. injected via a secret manager during initial setup):

```bash
export BOOTSTRAP_SUPER_ADMIN_EMAIL="admin@sofoftech.com"
export BOOTSTRAP_SUPER_ADMIN_PASSWORD="YourStrongPassword123!"
export BOOTSTRAP_SUPER_ADMIN_DISPLAY_NAME="Platform Developer"

pnpm --filter @multi-site-cms/api bootstrap:super-admin
```

## Security invariants and controls

1. **No Seeded Passwords**: No default email or password exists in migrations, seeds, or repository files.
2. **No HTTP Vector**: The bootstrap routine is implemented solely in `apps/api/src/database/cli/bootstrap-super-admin.ts`. It has no route handler or controller in NestJS and cannot be invoked over HTTP.
3. **Password Validation**:
   - Minimum length: 12 characters.
   - Character classes: Must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).
4. **Email Normalization**: Lowercases and trims input emails.
5. **Hijacking Prevention**:
   - If an active `super_admin` assignment already exists for a _different_ email address, the bootstrap process aborts immediately with an error. This prevents an unauthorized operator or attacker from hijacking platform ownership.
6. **Idempotency**:
   - Running the bootstrap command multiple times with the _same_ email address is safe. It updates the password hash and display name without duplicating role assignments (`partial unique index` on `user_role_assignments`).
7. **Audit Trail**:
   - Every bootstrap execution writes an append-only row to `audit_events`:
     - `actor_type`: `'bootstrap'`
     - `action`: `'auth.bootstrap'`
     - `entity_type`: `'user'`
     - `entity_id`: user UUID
     - `metadata`: `{ email: "...", role: "super_admin" }` (passwords and hashes are strictly omitted).

## Recovery procedure

If the sole Super Admin credentials are lost:

1. Access the deployment server / container shell with administrative credentials.
2. Run the bootstrap CLI command with the verified Super Admin email and a newly generated high-entropy password.
3. The command will detect the existing email, rotate the password hash using Argon2id, revoke prior active sessions, and record the recovery event in the audit log.
4. Log into `apps/admin` with the newly provisioned password.

## References

- [ADR-0012: Controlled Super Admin bootstrap](../adr/0012-super-admin-bootstrap.md)
- [ADR-0016: Session-based authentication and RBAC](../adr/0016-session-based-authentication-and-rbac.md)
- [Authentication documentation](authentication.md)
