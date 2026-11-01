# Data ownership and boundaries

Status: **design for Phase 02**. No tables exist beyond the extension bootstrap.

## Ownership model

The platform is a shared-database, shared-schema, site-scoped system. Every
tenant-owned row can be traced to a `sites.id` without joining through unrelated
data.

| Data               | Owner              | Tenant column          | Notes                                    |
| ------------------ | ------------------ | ---------------------- | ---------------------------------------- |
| Sites, domains     | Platform           | `sites.id` (root)      | Created by Super Admin only              |
| Users              | Platform           | none                   | Global identity, site-agnostic           |
| Roles, permissions | Platform           | none                   | `scope_type` distinguishes platform/site |
| Role assignments   | Platform           | `site_id` (nullable)   | Null only for platform scope             |
| Posts, revisions   | Platform editorial | none (via publication) | Canonical, site-neutral content          |
| Publications       | Site               | `site_id` (required)   | The tenant-visible unit                  |
| Media assets       | Site (or platform) | `site_id` (nullable)   | Null reserved for Super Admin assets     |
| Audit events       | Platform           | `site_id` (nullable)   | Null for platform-level actions          |
| Session records    | Platform           | none                   | Bound to a user, not a site              |

## Why posts are site-neutral

A post is canonical content with immutable revisions. Publishing to a site is a
separate `post_publications` row that pins one revision and owns the site's slug,
SEO metadata, and publication state. This is what allows one investigation to
appear on two publications with different headlines without duplicating a body.

Consequences:

- Deleting a site must not delete platform content; it removes that site's
  publications.
- A revision is reachable for a site only through a publication for that site.
- There is no `posts.site_id`. Adding one later would collapse shared content
  back into per-site copies.

## Read paths and tenant isolation

| Read                       | Scope rule                                               |
| -------------------------- | -------------------------------------------------------- |
| Admin list of publications | `WHERE site_id = :context`                               |
| Admin post list for a site | joined through publications with `site_id = :context`    |
| Public article page        | publication `site_id` + `status = 'published'` + slug    |
| Media library              | `WHERE site_id = :context` (plus platform assets for SA) |
| Audit log (Super Admin)    | all rows; Admin has no access                            |

A query that cannot be constrained this way is a design defect, not a
convenience to be worked around in the service layer.

## Write ownership

- Only the `sites` module creates sites and domains, and only under a Super Admin
  permission.
- Only the `posts` module creates revisions; publications reference immutable
  revisions and never mutate them.
- Only the `publications` module transitions publication state, inside a
  transaction that also writes the audit event.
- Media metadata is written by the media module after server-side validation of
  type, size, and dimensions; storage bytes live outside PostgreSQL.
- Audit rows are insert-only for the application role.

## Cross-site sharing

Sharing is explicit and audited:

1. Create a second publication for the same post on the other site (default).
2. Reuse a media asset across sites only by promoting it to platform scope under
   Super Admin review.

Never share implicitly through a join that ignores `site_id`.

## Retention and deletion

| Data         | Policy                                                                   |
| ------------ | ------------------------------------------------------------------------ |
| Posts        | Archived, not hard-deleted from the UI                                   |
| Revisions    | Retained while the post exists; legal deletion is a Super Admin workflow |
| Publications | Archived; URL history retained for redirects                             |
| Media        | Deletion blocked while referenced, or soft-delete + storage job          |
| Audit events | Append-only, never editable by application roles                         |
| Users        | Disabled/suspended, personal data removal on request with audit          |

## Environment boundaries

- Local Docker data is disposable and never restored into production.
- Production secrets live only in the hosting secret store.
- Backups are encrypted at rest by the provider and tested by a documented
  restore drill before real content exists.

## References

- [ERD](../architecture/erd.md)
- [Multi-site content model](../architecture/multi-site-content-model.md)
- [RBAC](../architecture/rbac.md)
- [Secrets](../security/secrets.md)
