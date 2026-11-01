# Documentation

This directory is the source of truth for architecture, development, security,
and deployment decisions. Phase 01 is a foundation only: no authentication,
posts, editor, media uploads, or publishing workflows are implemented. Anything
describing future behavior is labelled with its phase.

## Start here

| Audience             | Read in this order                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| New developer        | [Getting started](development/getting-started.md) → [Architecture overview](architecture/overview.md)                                            |
| Agent or contributor | [`AGENTS.md`](../AGENTS.md) → [Agent workflow](development/agent-workflow.md) → [Coding standards](development/coding-standards.md)              |
| Reviewer             | [Phase 01 scope](product/phase-01-scope.md) → [Threat model](architecture/threat-model.md)                                                       |
| Operator             | [Environments](deployment/environments.md) → [Free-tier deployment](deployment/free-tier-deployment.md) → [Operations](deployment/operations.md) |
| Security reviewer    | [Security checklist](security/security-checklist.md) → [Secrets](security/secrets.md)                                                            |
| Decision archaeology | [Architecture decision records](adr/README.md)                                                                                                   |

## Architecture

- [Overview](architecture/overview.md) — applications, boundaries, request flows.
- [Monorepo structure](architecture/monorepo-structure.md) — ownership and how to add a site or package.
- [Multi-site content model](architecture/multi-site-content-model.md) — canonical content, revisions, publications.
- [Entity relationship diagram](architecture/erd.md) — proposed Phase 02 schema.
- [RBAC](architecture/rbac.md) — Super Admin, site-scoped Admin, permission matrix.
- [Threat model](architecture/threat-model.md) — assets, trust boundaries, controls.
- [API conventions](architecture/api-conventions.md) — envelopes, errors, validation, versioning.
- [Dependency matrix](architecture/dependency-matrix.md) — verified versions and constraints.
- [Governance](architecture/governance.md) — change classes, ADR triggers, review rules.

## Database

- [Database overview](database/README.md) — technology, conventions, migration and JSONB policy, Super Admin bootstrap.
- [ERD](database/erd.md) — implemented schema, relationships, query-to-index map.
- [Data dictionary](database/data-dictionary.md) — every table, constraint, and invariant.
- [Multi-site isolation](database/multi-site-data-isolation.md) — ownership, composite keys, what the database cannot enforce.
- [Migrations and recovery](database/migrations-and-recovery.md) — workflow, rollback limits, restore drills.
- [Data ownership](database/data-ownership.md) — who owns which row, retention, deferred tables.

## Development

- [Getting started](development/getting-started.md)
- [Coding standards](development/coding-standards.md)
- [Testing](development/testing.md)
- [Agent workflow](development/agent-workflow.md)
- [Branching strategy](development/branching-strategy.md)
- [Troubleshooting](development/troubleshooting.md)

## Product

- [Phase 01 scope](product/phase-01-scope.md)

## Deployment and operations

- [Environments](deployment/environments.md)
- [Free-tier deployment](deployment/free-tier-deployment.md)
- [Operations runbook](deployment/operations.md)

## Security

- [Authentication and authorization](security/authentication.md)
- [Security checklist](security/security-checklist.md)
- [Secrets management](security/secrets.md)

## Architecture decisions

- [ADR index](adr/README.md)

## Documentation rules

1. Describe the repository as it exists. Label proposed or Phase 02 behavior
   explicitly.
2. Update the relevant document in the same change that alters a boundary,
   command, or dependency.
3. Record cross-cutting decisions as ADRs, not only in pull request comments.
4. Do not put secrets, production hostnames, or customer data in documentation.
5. Run `pnpm format` before committing Markdown changes.
