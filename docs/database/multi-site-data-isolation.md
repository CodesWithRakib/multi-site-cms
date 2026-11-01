# Multi-site data isolation

How the schema makes tenant boundaries explicit, what it can enforce, and what
still belongs to application authorization.

## Global versus site-owned

| Global (no `site_id`)           | Site-owned (`site_id`)                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `users`                         | `site_domains`, `categories`, `tags`, `events`                                                        |
| `roles`, `permissions`          | `post_publications`, `post_publication_categories`, `post_publication_tags`, `post_publication_media` |
| `role_permissions`              | `media_assets` (nullable for platform assets)                                                         |
| `posts`, `post_revisions`       |                                                                                                       |
| `audit_events` (nullable scope) |                                                                                                       |

`user_role_assignments` is the bridge: it is platform-owned but carries an
optional `site_id`, and that column is the definition of site access.

Content is global and publication is site-owned. That is the single most important
isolation decision: a site can only reach a post's body through a publication row
that carries its `site_id`.

## How ownership is represented and enforced

Four mechanisms, in increasing order of subtlety:

1. **Direct `site_id`** on the row (`post_publications`, `categories`, `tags`,
   `events`, `media_assets`).
2. **Site-prefixed uniqueness** so identity is per-tenant:
   `(site_id, slug)` for categories, tags, events, and publications;
   `(site_id, post_id)` for publications.
3. **Composite foreign keys that include `site_id`** so a row can only reference a
   row of the same tenant:
   - `post_publications (post_id, revision_id) → post_revisions (post_id, id)`
     proves the pinned revision belongs to that post;
   - `(event_id, site_id) → events (id, site_id)`;
   - `(featured_image_id, site_id) → media_assets (id, site_id)`;
   - junction tables `(publication_id, site_id)` and `(category_id, site_id)`.
4. **Partial unique indexes** for per-tenant invariants, such as one primary domain
   per site and no duplicate role grant.

Because of (3), a publication cannot reference another tenant's media, category,
tag, or event even if the service forgets to check. The database rejects it.

## Domain resolution

- `site_domains.hostname` is globally unique and case-insensitive (`citext`), with
  a check constraint requiring lowercase and a hostname character set.
- A request host is normalized before lookup (lowercase, no scheme/port/path,
  strip a trailing dot) and matched against `site_domains`.
- A row is not ownership proof. `verified_at` records a completed challenge, and
  the verification workflow itself is deferred.
- Public reads resolve the site on the server. A client-supplied hostname or site
  key selects which public content to show; it never authorizes an administrative
  action.
- Unknown or `disabled` domains resolve to no site, not to a default site.

## Site-specific uniqueness

| Rule                              | Enforced by                                  |
| --------------------------------- | -------------------------------------------- |
| One publication per post per site | `UQ_post_publications_site_post`             |
| One slug per site                 | `UQ_post_publications_site_slug`             |
| One category slug per site        | `UQ_categories_site_slug`                    |
| One tag slug per site             | `UQ_tags_site_slug`                          |
| One event slug per site           | `UQ_events_site_slug`                        |
| One primary domain per site       | `UQ_site_domains_primary_per_site` (partial) |
| Globally unique hostname          | `UQ_site_domains_hostname`                   |
| One role grant per user/site      | `UQ_user_role_assignments_site` (partial)    |

Archived publications keep their slug. Reusing it would silently repoint a public
URL, so reuse requires an explicit redirect decision in a later phase.

## Cross-site access risks and mitigations

| Risk                                                    | Mitigation                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Forged `siteId` in an admin request                     | Server-resolved membership; the path value is only a lookup key                 |
| Query by primary key without a tenant filter            | Mandatory `site_id` predicate in the service; return 404 on miss                |
| Publishing content that references another site's media | Composite FK rejects the write at the database level                            |
| Category/tag assigned across sites                      | Composite FK rejects the junction row                                           |
| Media leak through a featured image                     | Composite FK + site-scoped media library                                        |
| Enumeration of other tenants' content                   | 404 for out-of-scope resources; no existence signal                             |
| Super Admin asset leaked by an Admin                    | Platform assets (`site_id IS NULL`) are not accepted as a publication reference |
| Stale authorization after access removal                | Re-resolve assignments per request; no cached permission set                    |

## What the database does not do

The schema cannot decide _who may read a row_. That requires the authenticated
actor, which is application state. Therefore:

- Every site-scoped read must include `site_id` in the predicate.
- Every write must verify the caller holds the required permission on that site.
- The API, not the database, returns `404` versus `403`.
- Row-Level Security is **not** implemented. It is a reasonable future addition
  (a session variable plus policies for the publication reads), but it would not
  remove the need for service-level checks, and it complicates connection
  pooling. Adding it requires an ADR.

Treat the constraints here as a safety net that turns a coding mistake into a
failed request rather than a cross-tenant data leak.

## Audit tampering

- `audit_events` has no `updated_at` and no application write path that updates it.
- The application role must receive only `INSERT` and `SELECT`. A migration role
  owns the schema; the runtime role never gets `UPDATE`, `DELETE`, or `TRUNCATE`
  on this table. Granting that separation is a deployment step, documented in
  [migrations and recovery](migrations-and-recovery.md).

## Publication and scheduling races

Two workers can try to publish the same scheduled publication. The schema prevents
duplicate rows but not duplicate side effects, so the publishing service must:

1. Claim work with a conditional update
   (`UPDATE … SET status = 'published', published_at = now() WHERE id = $1 AND status = 'scheduled'`).
2. Continue only when exactly one row was affected.
3. Write the audit event in the same transaction.

That pattern is recorded in ADR-0011; the worker itself is a later phase.

## Verification

The integration suite asserts the isolation rules against real PostgreSQL:
cross-site revision, media, event, category, and tag references are rejected;
duplicate per-site slugs and publications are rejected; platform-role/site
mismatches are rejected. Run it with
`pnpm --filter @multi-site-cms/api test:integration`.
