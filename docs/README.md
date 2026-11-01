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

## Backend

- [Backend overview](backend/README.md) — module map, request lifecycle, boundaries.
- [API standards](backend/api-standards.md) — envelopes, errors, validation, localization, OpenAPI.
- [Configuration](backend/configuration.md) — every environment variable and production rule.
- [Database integration](backend/database.md) — pooling, lifecycle, readiness, migration commands.
- [Backend security](backend/security.md) — implemented controls and the Phase 04 boundary.
- [Backend development](backend/development.md) — commands and the endpoint checklist.

## Multi-Site Core

- [Site Management & Lifecycle](multisite/site-management.md) — Tenant registry, lifecycle states, and soft-deletion/archiving policy.
- [Domain Management & Resolution](multisite/domain-resolution.md) — Domain registry, normalization, primary domain transaction, and DNS verification challenge.
- [Site Configuration & Public Discovery](multisite/site-configuration.md) — Branding, acyclic navigation trees, SEO defaults, locales, and public ETag caching.
- [Multi-Site Authorization Matrix](multisite/site-authorization-matrix.md) — Super Admin vs Site Admin permissions, 404 IDOR protection, and audit logs.

## Content Management System (CMS Core)

- [Canonical Content Model](content/content-model.md) — Source posts, content types, structured editor JSON validation.
- [Content API Reference](content/content-api.md) — REST endpoints for posts, publications, revisions, taxonomy, and media.
- [Site Publications](content/site-publications.md) — Multi-site publishing, site-scoped slugs, pinned revisions, and SEO overrides.
- [Site-Scoped Taxonomy](content/taxonomy.md) — Hierarchical categories, acyclic tree validation, and tag associations.
- [Revision History & OCC](content/revision-history.md) — Optimistic concurrency control, version snapshots, and safe rollback.
- [Media Metadata Foundation](content/media-metadata.md) — Abstract storage keys, MIME allowlists, and deletion protection.
- [Content Authorization & Isolation](content/content-authorization.md) — Multi-tenant boundaries, RBAC permissions, and opaque 404 denials.

## Rich Text Editor & Media Upload System

- [Editor Architecture](editor/editor-architecture.md) — Headless Tiptap integration, React 19 RSC/Client split, and local state isolation.
- [Custom Extensions](editor/editor-extensions.md) — Destination cards, event timelines, callouts, and AST schemas.
- [Content-Type Configurations](editor/content-type-configurations.md) — Presets for Travel Blog, Air Sports, and Articles.
- [Media Upload Pipeline](media/upload-architecture.md) — Multipart upload, magic byte sniffing, SVG sanitization, and size limits.
- [Storage Provider](media/storage-provider.md) — LocalStorageProvider, path traversal protection, and asset streaming route.
- [Autosave & Draft Recovery](editor/autosave-and-recovery.md) — Debounced saving, sessionStorage snapshots, and OCC conflict handling.
- [Authenticated Preview System](editor/preview-system.md) — Ephemeral HMAC-SHA256 tokens, crawler suppression, and layout simulation.
- [Editorial Security](editor/security.md) — File validation, XSS prevention, tenant isolation, and preview controls.

## Publishing Engine & Scheduling

- [Publishing Lifecycle & State Machine](publishing/publishing-lifecycle.md) — 5-state lifecycle, transition matrix, capability permissions, and audit logs.
- [Scheduled Publishing Semantics](publishing/scheduled-publishing.md) — Canonical UTC normalization, future validation, rescheduling, and cancellation.
- [Background Jobs & Polling Infrastructure](publishing/background-jobs.md) — Concurrency workers via PostgreSQL `FOR UPDATE SKIP LOCKED`.
- [Transactional Outbox Pattern](publishing/outbox-and-events.md) — Dual-write elimination, `outbox_events` schema, exponential backoff, and dead-letter queue.
- [Next.js Cache Invalidation](publishing/cache-invalidation.md) — Path derivation, on-demand ISR revalidation, and webhook secrets.
- [Real-Time Updates (SSE)](publishing/realtime-updates.md) — Server-Sent Events, site channel isolation, draft suppression, and client reconnection.
- [Operations & Disaster Recovery](publishing/operations-and-recovery.md) — Health statistics, downtime recovery, and dead-letter replay procedures.

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
