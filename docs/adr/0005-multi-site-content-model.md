# ADR-0005: Canonical posts with per-site publications

- Status: Proposed (requires approval before the Phase 02 schema migration)
- Date: 2026-11-01
- Owners: platform + database engineering

## Context

The platform must support shared source content, site-specific content, shared
content with site-specific overrides, different publication states per site, and
different SEO metadata per site. Editors will also edit published work, and a
reader must never see a half-edited body.

Copying bodies per site duplicates edits and guarantees drift; a single `site_id`
on a post makes cross-site publishing impossible without duplication.

## Decision

Three layers:

1. `posts` — stable, site-neutral identity (author, lifecycle, timestamps).
2. `post_revisions` — immutable versions containing title, excerpt, and Tiptap
   JSON body; monotonically numbered per post.
3. `post_publications` — the join of post × site × pinned revision, owning slug,
   SEO title/description, social image, template key, status, and timestamps.

Uniqueness: `(site_id, post_id)` and `(site_id, slug)`; the revision must belong
to the post via a composite foreign key. Statuses: `draft`, `scheduled`,
`published`, `archived`. Editing creates a revision; publishing moves the
publication's pinned revision.

## Alternatives considered

| Option                                   | Why not                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `posts.site_id` (one site per post)      | Cannot share content; forces duplication and divergent copies                       |
| Per-site body overrides in a JSON column | Untyped, unauditable, and hides which site owns which content                       |
| Copy-on-publish snapshot rows            | Body duplication again, with no revision provenance                                 |
| `post_sites` with only a status flag     | No place for site-specific SEO, slug, or template, so those leak into global fields |

## Consequences

Positive: one editorial workflow, per-site metadata and scheduling, immutable
history, and a clean path to a third site. Media and SEO stay site-scoped, which
prevents cross-tenant leakage.

Negative: every admin read joins through publications; more tables to reason
about; "delete a site" must remove its publications rather than its content.

Accepted cost: query complexity in exchange for correctness and sharing.

## Future migration considerations

Localization would add a translation group and a `locale` column, with each
translated text as its own post — not a JSON map on one revision. Slug history
adds a redirect table. Divergent bodies per site are explicitly unsupported; if a
real need appears, model a site-specific override revision with explicit
provenance rather than mutating shared history.

See [multi-site content model](../architecture/multi-site-content-model.md) and
the [ERD](../architecture/erd.md).
