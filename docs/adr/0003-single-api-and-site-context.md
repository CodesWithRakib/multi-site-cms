# ADR-0003: Single modular-monolith API with trusted site context

- Status: Accepted
- Date: 2026-11-01
- Owners: platform engineering

## Context

All sites and the admin share one database, one authorization model, and one
content infrastructure. Tenant scoping is required on nearly every read and write,
and privileged actions (publishing, role assignment, site creation) must be
audited in one place.

An API per site would duplicate authorization logic — the most dangerous thing to
duplicate — and make cross-site content sharing a distributed transaction.

## Decision

One NestJS application at `apps/api`, served under `/api/v1`, organized as a
modular monolith: one directory per domain module (`sites`, `auth`, `posts`,
`publications`, `media`, `audit` in Phase 02), each with its own controller,
service, DTOs, and entities.

Site context rules:

1. Admin routes are site-scoped (`/sites/:siteId/...`); a guard resolves the
   caller's membership for that site on every request.
2. The path/body `siteId` is a lookup key, never proof of authorization.
3. Queries additionally constrain by `site_id` so a guard bug cannot widen results.
4. Public reads resolve the site server-side from a public site key or a
   trusted hostname mapping. A caller-supplied `Host` header is not authority.
5. Cross-tenant objects return `404` to avoid confirming their existence.
6. Modules communicate through services or explicit events, never by importing
   another module's repository.

## Alternatives considered

| Option                             | Why not                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| Microservice per domain            | Operational cost with no current scale driver; distributed auth                                 |
| Per-site API instances             | Duplicated authorization and migrations; no shared content path                                 |
| GraphQL instead of REST            | Adds schema/caching complexity before a client need exists                                      |
| Server actions replacing the API   | Ties privileged logic to a frontend framework; admin + sites + future clients need one contract |
| Schema-per-tenant or DB-per-tenant | Migration and cross-site query complexity for two sites                                         |

## Consequences

Positive: one authorization implementation, one migration path, transactional
cross-site publication, simple local development, one contract for every client.

Negative: a single deploy unit for all API consumers; module discipline is
cultural, not enforced by the network; a noisy module can affect all sites.

Accepted cost: we rely on module boundaries and code review rather than process
isolation.

## Future migration considerations

Extract a module into a service only with a measured driver (independent scaling,
a different runtime, or a team boundary) and an ADR. The domain modules are
already separated by contract, so extraction is a transport change rather than a
rewrite. Adding a second database per site would be a foundational change and
must supersede this decision.
