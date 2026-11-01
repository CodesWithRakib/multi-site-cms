# ADR-0009: Site-scoped taxonomy enforced with composite foreign keys

- Status: Accepted
- Date: 2026-11-01
- Owners: database + security engineering

## Context

The platform serves independent publications from one database. A missing tenant
filter in one service is a data leak, and the most likely place for that mistake is
a join: category to post, media to publication, event to live update.

Two questions had to be answered together:

1. Are categories and tags shared across sites or owned by one site?
2. How much of the tenancy boundary can the database enforce, given that
   authorization needs the authenticated user?

## Decision

**Taxonomy is site-owned.** `categories` and `tags` carry `site_id`, are unique on
`(site_id, slug)`, and are attached to publications, not to canonical posts. A post
can be "Destinations" on the travel site and "Reports" on the air sports site.

**Same-site references are enforced by composite foreign keys.** Every join table
and nullable cross-reference carries `site_id` as part of the key:

- `post_publications (post_id, revision_id) → post_revisions (post_id, id)`
- `post_publications (event_id, site_id) → events (id, site_id)`
- `post_publications (featured_image_id, site_id) → media_assets (id, site_id)`
- `post_publication_categories (publication_id, site_id)` and
  `(category_id, site_id)`
- the equivalent pairs for tags and media usage

Consequence: platform-scoped media (`site_id IS NULL`) cannot be used as a
publication's featured image. Promoting an asset to platform scope is an explicit
Super Admin action for sharing outside a publication, not a shortcut.

**Row-Level Security is not implemented.** Application-layer authorization remains
mandatory and is documented rather than assumed.

## Alternatives considered

| Option                                       | Why not                                                                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Shared taxonomy with a visibility table      | Extra join and policy on every read; no requirement yet                                                                              |
| Taxonomy on the canonical post               | Breaks per-site filing, which is the point of publications                                                                           |
| Application-only checks                      | One forgotten predicate becomes a cross-tenant leak                                                                                  |
| A trigger validating `site_id` on each write | More moving parts than a foreign key; harder to review                                                                               |
| Row-Level Security now                       | Requires a per-request session variable, complicates pooling, and does not remove service checks; deferred with a trigger to revisit |
| `site_id` on every table "to be safe"        | Redundant columns without an ownership model invite wrong joins                                                                      |

## Consequences

Positive: the database rejects the most damaging cross-tenant writes; the intent of
each relationship is visible in the schema; services get a cheaper, earlier failure.

Negative: more composite keys and a denormalized `site_id` in three join tables;
an insert must supply `site_id` consistently; the `featured_image_id` rule makes
platform assets unusable as a featured image, which will need a deliberate product
decision if ever required.

Accepted cost: redundant columns with a real constraint behind them, plus the need
to explain the model to every new contributor.

## Future migration considerations

If several sites genuinely share a taxonomy, add an explicit shared-scope model
(e.g. a nullable owner plus a visibility table) with a migration and a superseding
ADR — not by dropping the composite keys. RLS can be layered on later for public
reads; it would complement, not replace, these constraints.
