# ADR-0012: Controlled Super Admin bootstrap

- Status: Accepted
- Date: 2026-11-01
- Owners: security + platform engineering

## Context

The platform needs a first `super_admin`. The obvious shortcuts are all unsafe:

- Seeding a default email/password pair (a known credential in every deployment).
- Exposing "make me an admin" on first load (an unauthenticated privilege grant).
- Hardcoding a privileged user ID (a permanent bypass, and it breaks per environment).

The database already supports everything the safe options need: `users`,
`role_assignments`, and an append-only `audit_events` with
`actor_type = 'bootstrap'`. Phase 02 must not implement authentication, but it must
fix the intended procedure so a later phase cannot invent a weaker one.

## Decision

The first Super Admin is created by an **operator-run CLI task**, not by an HTTP
endpoint or a seed:

1. The operator sets `BOOTSTRAP_SUPER_ADMIN_EMAIL` in the deployment environment
   (secret store), and, when the auth phase lands, a one-time bootstrap token with
   a short expiry.
2. The task runs with the schema's migration credentials, in the target
   environment, as a deliberate deploy step.
3. It creates the user with `status = 'invited'`, no usable password unless one is
   supplied interactively, and assigns the `super_admin` platform role.
4. It writes an `audit_events` row with `actor_type = 'bootstrap'`,
   `action = 'user.bootstrap_super_admin'`, and no secret in `metadata`.
5. It is idempotent: running it again for the same email does not duplicate the
   assignment (partial unique index enforces one platform grant).

Hard rules:

- No seeded privileged account, in any environment.
- No public or unauthenticated endpoint can create a Super Admin.
- The last remaining Super Admin cannot be demoted or disabled.
- Granting `super_admin` afterwards requires an existing Super Admin and writes an
  audit event.

## Alternatives considered

| Option                                 | Why not                                                          |
| -------------------------------------- | ---------------------------------------------------------------- |
| Seed with a default password           | Known credential; the most common real-world breach vector       |
| First-signup-becomes-admin             | Anyone who finds the deployment before the operator does owns it |
| Hardcoded user ID                      | Environment-specific, unauditable, impossible to change safely   |
| External IdP as the only admin source  | Adds a vendor dependency before the auth model is chosen         |
| Signed invite link generated at deploy | Viable; retained as an input to the auth phase, not needed now   |

## Consequences

Positive: no known credentials, no unauthenticated privilege grant, an audit trail
for the most sensitive action in the system, and one path that works identically in
staging and production.

Negative: initial setup requires operator access to the environment and a CLI step,
which is slightly more work than a seed and must be documented for whoever deploys.

Accepted cost: a manual step at provisioning time, in exchange for removing the
highest-severity misconfiguration risk.

## Future migration considerations

The auth phase implements the task and may add an expiring, single-use bootstrap
token or a signed invite link. Either must keep these properties: operator-gated,
single use, audited, expiring, and idempotent. If SSO is adopted later, the
bootstrap path remains for the first local Super Admin and for recovery.
