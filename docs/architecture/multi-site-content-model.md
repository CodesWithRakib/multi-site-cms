# Multi-site content model

Status: **design for Phase 02**. No content tables or entities exist in Phase 01.

## Core problem

A centralized platform must let one editorial team manage content that can be
published to one or many sites without copying bodies, losing revision history,
or letting one site's metadata mutate another site's publication.

The model separates four concerns:

1. **Tenant identity** — which site owns a hostname and its settings.
2. **Canonical content** — the editable post identity and immutable revisions.
3. **Publication** — the decision to expose a specific revision on a specific
   site, with site-specific URL and SEO metadata.
4. **Authorization** — who may act on a site and which rows belong to it.

## Principles

### Sites are data, presentation is code

`sites` and `site_domains` are database records. A new site must not require a
new enum value, a new `if` branch in the API, or a copy of the authorization
logic. In Phase 01, each public site is still a separate deployable Next.js app
with code-owned presentation. That is an implementation choice, not a statement
that site identity is hardcoded.

`siteConfig.key` in each site app is the stable bridge between code and the
future `sites.key` row.

### Canonical content is site-neutral

A post belongs to the platform, not directly to one site. Its title, excerpt,
and body live in revisions. A post may be published to one site, several sites,
or none.

This supports:

- One investigation published on two publications with different headlines and
  slugs.
- A travel guide published on the travel site and a regional partner site.
- Draft content that has never been published anywhere.

If two sites need materially different bodies, they need two posts. V1 does not
support divergent bodies inside one canonical post.

### Revisions are immutable and publications pin one revision

Editing a post creates a new revision. Existing publications continue to point
at the revision that was approved and published until an editor explicitly
publishes a newer revision. A reader must never observe a half-edited body.

```
post ──< revision 1
     ├─< revision 2  ← publication A pins revision 1
     └─< revision 3  ← publication B pins revision 2
```

### Publication metadata is site-scoped

Each publication owns:

- slug and canonical URL for that site;
- SEO title and description;
- social image;
- template/presentation key;
- publish status and timestamps;
- optional redirect history in a later migration.

It does **not** own a divergent body. It points at `revision_id`.

### Every site-owned row is reachable from a site

Queries must be constrainable by `site_id` without scanning unrelated tenants.
For publication data this is direct. For revisions, the path is
`post_publication.site_id → post_publication.revision_id`. A revision is readable
through a publication only if the caller can read that site and the publication
is visible in that context.

## Entities

### Site and domains

`sites` stores the stable key, display name, default locale, lifecycle status,
and non-secret presentation settings. `site_domains` stores normalized hostnames
and whether one is primary.

Rules:

- `sites.key` is lowercase ASCII, immutable after creation, and used in public
  URLs and configuration.
- `site_domains.hostname` is unique across the platform, lowercase, and contains
  no scheme, path, or trailing dot.
- A site may have multiple domains but at most one primary domain.
- Domain verification is a Phase 02+ workflow; a row alone must not be treated as
  proof of ownership.
- Local development hostnames are not stored as production domains.

### Users and roles

`users` stores identity. Password hashes are never selected by general user
queries. `roles`, `permissions`, `role_permissions`, and
`user_role_assignments` implement scoped RBAC. See [RBAC](rbac.md).

### Posts and revisions

`posts` is the stable identity. It stores the author, lifecycle state, and
timestamps. Editorial fields live in `post_revisions`.

A revision contains:

- monotonically increasing `revision_number` per post;
- title, optional excerpt, and Tiptap JSON body;
- optional plain-text search projection, added only when search is implemented;
- author and creation timestamp;
- optional change summary.

A revision is immutable after creation. Restoring an old revision creates a new
revision with the old content; it never mutates history.

### Publications

`post_publications` is the join between a post, a site, and a pinned revision.
Uniqueness:

- one publication per `(site_id, post_id)` in v1;
- one slug per `(site_id, slug)`;
- `revision_id` must belong to `post_id` (enforced by a composite foreign key).

Status values:

| Status      | Meaning                                                         |
| ----------- | --------------------------------------------------------------- |
| `draft`     | Site-specific publication exists but is not publicly readable.  |
| `scheduled` | Approved revision with a future `scheduled_for` timestamp.      |
| `published` | Publicly readable; `published_at` is set.                       |
| `archived`  | Previously published, intentionally removed from public routes. |

Allowed transitions:

```text
draft ──> scheduled ──> published ──> archived
  │           │             │
  └──────────>│             └──> published (new revision)
              └──> draft (cancel schedule)
```

Unpublishing moves a publication to `archived` and records an audit event. It
does not delete the post, revision, or URL history.

### Media

`media_assets` stores object-storage metadata. In Phase 02, media is site-scoped:
an asset belongs to one site and may be used by publications on that site.
Cross-site reuse is deliberately not implicit. Options when needed:

1. Upload a separate copy for the other site.
2. Promote an asset to platform scope with `site_id = NULL` under Super Admin
   only, after an explicit review.

The second option must be an explicit workflow, never a side effect of
publishing to another site. This prevents an Admin from exposing one tenant's
private media through another tenant's publication.

### Audit events

Security-relevant writes append to `audit_events`: site creation, domain changes,
role assignment, publication/unpublication, media deletion, and settings changes.
Audit rows include the actor, site scope, action, entity, request ID, IP address,
and a metadata object. They are append-only from the application role.

## SEO and URL rules

- Slugs are lowercase, Unicode-normalized (NFKC), and restricted to
  `[a-z0-9-]`; generation from a title is deterministic and reviewed by the
  editor.
- Publication URLs are `/{slug}` in v1. Nested sections and locale prefixes are
  deferred until a route model exists.
- A published slug is part of the public contract. Renaming a published
  publication requires a redirect row in the same transaction (Phase 02+).
- `canonical_url` is optional. When empty, the site's own publication URL is
  canonical. Setting it to another site's URL requires Super Admin review to
  prevent accidental cross-domain SEO damage.
- `seo_title` and `seo_description` have length limits enforced at the DTO and
  database layers. Empty values fall back to revision fields at render time, not
  at write time.

## Localization

Localization is intentionally deferred. The Phase 02 schema can add a `locale`
column to posts and publications later, but v1 must not pretend to support
translated bodies. A translated article is a separate post linked by a future
translation group. Do not overload `site.locales` to imply that translations
exist.

## Deletion and retention

- Posts are archived, not hard-deleted through ordinary UI.
- Publications are archived and audited.
- Revisions are retained while the post exists. Legal or privacy deletion is a
  separate Super Admin workflow with an audit trail.
- Media deletion is blocked while referenced by a publication, or performs a
  reviewed soft-delete and storage cleanup job.
- Audit events are retained according to policy and are never editable by normal
  application roles.

## Future entities

The following are expected but intentionally absent:

- categories and tags;
- redirects and slug history;
- comments and moderation;
- newsletters and subscribers;
- webhooks and delivery logs;
- revisions of site settings;
- translation groups and locales.

Do not create empty tables or placeholder services for these in Phase 02. Add
them when the feature is approved.

## Phase 02 implementation order

1. Sites, domains, users, roles, permissions, and assignments.
2. Session authentication and site-context guards.
3. Posts and revisions.
4. Publications and the public read endpoint.
5. Audit events.
6. Media metadata and upload pipeline.
7. Scheduling and background jobs.
8. Search and taxonomy.

Each step requires a reviewed migration, contract tests, isolation tests, and an
audit path. The ERD in [erd.md](erd.md) is the starting point, not a frozen
schema.
