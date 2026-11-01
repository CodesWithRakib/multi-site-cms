# Architecture decision records

One file per decision. Records are immutable: a later decision supersedes an
earlier one with a new ADR and a `Status` line change, never by rewriting history.

| ADR                                                     | Decision                                                 | Status   |
| ------------------------------------------------------- | -------------------------------------------------------- | -------- |
| [0001](0001-monorepo-pnpm-turborepo.md)                 | pnpm workspace + Turborepo monorepo                      | Accepted |
| [0002](0002-independent-site-apps.md)                   | One deployable Next.js application per public site       | Accepted |
| [0003](0003-single-api-and-site-context.md)             | Single modular-monolith API with trusted site context    | Accepted |
| [0004](0004-state-management.md)                        | Redux Toolkit + RTK Query, server-first elsewhere        | Accepted |
| [0005](0005-multi-site-content-model.md)                | Canonical posts with per-site publications               | Accepted |
| [0006](0006-free-first-hosting.md)                      | Free-first hosting with documented limits                | Proposed |
| [0007](0007-postgres-typeorm-migrations.md)             | PostgreSQL + TypeORM with explicit migrations            | Accepted |
| [0008](0008-uuid-primary-keys.md)                       | UUID primary keys, `timestamptz`, one `bigint` exception | Accepted |
| [0009](0009-site-scoped-taxonomy-and-composite-keys.md) | Site-scoped taxonomy, composite-key isolation            | Accepted |
| [0010](0010-media-metadata-and-storage-abstraction.md)  | Media metadata + opaque storage keys                     | Accepted |
| [0011](0011-publication-scheduling-model.md)            | Publication state and scheduling without a job table     | Accepted |
| [0012](0012-super-admin-bootstrap.md)                   | Controlled Super Admin bootstrap                         | Proposed |
| [0013](0013-api-envelope-and-error-contract.md)         | Single response envelope with structured field errors    | Accepted |
| [0014](0014-localization-strategy.md)                   | Locale negotiation with a typed message catalog          | Accepted |
| [0015](0015-liveness-readiness-and-lazy-datasource.md)  | Separate liveness/readiness, lazily opened pool          | Accepted |

## Template

```markdown
# ADR-000N: Title

- Status: Proposed | Accepted | Superseded by ADR-XXXX
- Date: YYYY-MM-DD
- Owners: role, not a personal name

## Context

Forces at play, constraints, and what would happen without a decision.

## Decision

The rule, stated so an implementation can be checked against it.

## Alternatives considered

Each option, and why it lost.

## Consequences

Positive, negative, and the cost we accept.

## Future migration considerations

What would have to be true to revisit this, and what the change would cost.
```

## Conventions

- Numbering is sequential and never reused.
- An ADR is `Accepted` when the code or the phase scope reflects it; `Proposed`
  when it needs approval.
- Diagrams are Mermaid in fenced blocks.
- Security-relevant consequences must be restated in the threat model.
