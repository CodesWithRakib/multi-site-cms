# Architecture decision records

One file per decision. Records are immutable: a later decision supersedes an
earlier one with a new ADR and a `Status` line change, never by rewriting history.

| ADR                                         | Decision                                              | Status   |
| ------------------------------------------- | ----------------------------------------------------- | -------- |
| [0001](0001-monorepo-pnpm-turborepo.md)     | pnpm workspace + Turborepo monorepo                   | Accepted |
| [0002](0002-independent-site-apps.md)       | One deployable Next.js application per public site    | Accepted |
| [0003](0003-single-api-and-site-context.md) | Single modular-monolith API with trusted site context | Accepted |
| [0004](0004-state-management.md)            | Redux Toolkit + RTK Query, server-first elsewhere     | Accepted |
| [0005](0005-multi-site-content-model.md)    | Canonical posts with per-site publications            | Proposed |
| [0006](0006-free-first-hosting.md)          | Free-first hosting with documented limits             | Proposed |

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
