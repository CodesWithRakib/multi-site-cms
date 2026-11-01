# ADR-0002: One deployable Next.js application per public site

- Status: Accepted
- Date: 2026-11-01
- Owners: platform engineering

## Context

Travel Blog and Air Sports Live have separate domains, branding, navigation,
content presentation, and release expectations. They share a backend, database,
and admin. A third site is expected later.

Two shapes were possible: a single Next.js application that resolves the site at
request time (multi-tenant frontend), or one application per site (shared code,
separate deployments).

## Decision

Each public site is its own Next.js application under `apps/sites/<key>`, with its
own theme, typography, navigation, homepage, and metadata. Shared capability lives
in packages; presentation composition lives in the application.

Site identity bridge: `apps/sites/<key>/src/config/site.ts` exports a
`siteConfig.key` that will map to `sites.key` in Phase 02. Hostname and settings
are data; templates and styling are code until a shared template system is
justified.

## Alternatives considered

| Option                                   | Why not                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| One app, hostname-based theme resolution | One deploy couples all sites' failures; a bad brand change risks two publications; cache and bundle boundaries blur |
| One app per site with a copied codebase  | Duplication drift; the same bug fixed twice                                                                         |
| Static site generator per site           | Live coverage needs server rendering and near-real-time updates                                                     |
| Shared template registry in the database | Premature; it abstracts before a second template pattern exists                                                     |

## Consequences

Positive: independent deploy and rollback per publication; isolated failure
domains; each site can pick its own rendering strategy and dependencies; branding
changes never touch another site.

Negative: more deployments and more CI targets; a shared UI change requires
verifying every site; duplicated app scaffolding that must stay thin and
consistent.

Accepted cost: two (soon three) Vercel projects on the free tier instead of one,
with the quotas that implies.

## Future migration considerations

If the number of sites grows past roughly five, or several sites become variants
of one product, revisit a shared template layer driven by `sites.settings` plus a
small allowlisted component registry. Any such registry must key off data, never
off a hardcoded list of site names, and must not move per-site business rules into
presentation code.
