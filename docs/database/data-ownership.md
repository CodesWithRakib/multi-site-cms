# Data ownership and boundaries

Status: **implemented** in the Phase 02 migrations. Schema detail is in the
[data dictionary](data-dictionary.md); isolation mechanics are in
[multi-site data isolation](multi-site-data-isolation.md).

## Ownership model

The platform is a shared-database, shared-schema, site-scoped system. Every
tenant-owned row can be traced to `sites.id` without joining through unrelated
data.

| Data                           | Owner              | Tenant column          | Notes                                               |
| ------------------------------ | ------------------ | ---------------------- | --------------------------------------------------- |
| `sites`, `site_domains`        | Platform           | root / `site_id`       | Created by Super Admin only                         |
| `users`                        | Platform           | none                   | Global identity, site-agnostic                      |
| `roles`, `permissions`         | Platform           | none                   | `scope_type` distinguishes platform vs site         |
| `user_role_assignments`        | Platform           | `site_id` (nullable)   | Null only for platform scope; this _is_ site access |
| `posts`, `post_revisions`      | Platform editorial | none (via publication) | Canonical, site-neutral content                     |
| `post_publications`            | Site               | `site_id` (required)   | The tenant-visible unit                             |
| `categories`, `tags`           | Site               | `site_id` (required)   | Attached to publications, not posts                 |
| `events`                       | Site               | `site_id` (required)   | Live-event anchor for the air sports site           |
| `post_publication_*` junctions | Site               | `site_id` (required)   | Both foreign keys include it                        |
| `media_assets`                 | Site (or platform) | `site_id` (nullable)   | Null reserved for Super Admin assets                |
| `audit_events`                 | Platform           | `site_id` (nullable)   | Null for platform-level actions                     |

## Why posts are site-neutral

A post is canonical content with immutable revisions. Publishing to a site is a
separate `post_publications` row that pins one revision and owns the site's slug,
SEO metadata, schedule, and publication state. This is what allows one
investigation to appear on two publications with different headlines without
duplicating a body.

Consequences:

- Deleting a site removes that site's publications, taxonomy, events, and domains;
  it does not delete platform content. Content deletion is a separate, audited
  operation.
- A revision is reachable for a site only through a publication for that site.
- There is no `posts.site_id`. Adding one later would collapse shared content back
  into per-site copies and break the composite-key isolation model.

## Read paths and tenant isolation

| Read                       | Scope rule                                               |
| -------------------------- | -------------------------------------------------------- |
| Admin list of publications | `WHERE site_id = :context`                               |
| Admin post list for a site | joined through publications with `site_id = :context`    |
| Public article page        | publication `site_id` + `status = 'published'` + slug    |
| Media library              | `WHERE site_id = :context` (plus platform assets for SA) |
| Taxonomy management        | `WHERE site_id = :context`                               |
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
   Super Admin review. Platform assets cannot be attached to a publication as a
   featured image, because that reference is site-scoped by constraint.

Never share implicitly through a join that ignores `site_id`.

## Retention and deletion

| Data             | Policy                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Posts            | Archived, not hard-deleted from the UI; `deleted_at` is recoverable                                                        |
| Revisions        | Retained while the post exists; legal deletion is a Super Admin workflow                                                   |
| Publications     | Archived; slug stays reserved for URL stability                                                                            |
| Media            | Deletion blocked while referenced (`RESTRICT`), or soft-delete + storage cleanup                                           |
| Taxonomy, events | Deleted with the site (`CASCADE`); a category in use is restricted                                                         |
| Audit events     | Append-only, never updated; purged after the admin setting Settings → Maintenance → audit retention (default 730, min 365) |
| Users            | Disabled/suspended; deletion restricted while content references them                                                      |
| Page views       | Purged after `ANALYTICS_RETENTION_DAYS` (default 730: the 1-year view compares with the previous year)                     |
| Sessions         | Purged `SESSION_RETENTION_DAYS` (default 30) after expiry or revocation                                                    |
| Outbox events    | Completed and dead-lettered events purged after `OUTBOX_RETENTION_DAYS` (default 30)                                       |

The purge runs inside the API (`src/maintenance/retention.job.ts`) shortly after
boot and then daily, in batches of 5,000 rows, under a PostgreSQL advisory lock
so only one instance purges at a time. Each run that deletes rows writes a
`retention.purge` audit event with the counts. Disable with
`RETENTION_JOB_ENABLED=false`.

### Generated analytics (one-time cleanup)

Migration `AnalyticsAndTrafficEvents1793491207000` used to insert about 90 days
of random page views for every site that existed when it ran. New installs no
longer get them. A database that already ran it keeps them until an operator
removes them:

```bash
pnpm --filter @multi-site-cms/api build
pnpm --filter @multi-site-cms/api db:cleanup:generated-analytics          # dry run: counts only
pnpm --filter @multi-site-cms/api db:cleanup:generated-analytics --apply  # after a backup
```

The rows are identified by the `xmin` of that migration's `typeorm_migrations`
record, which they share. A logical dump/restore (`pg_dump` → `pg_restore`)
rewrites every `xmin`, so run the cleanup on the original database before
moving it that way.

## Deferred tables

Each is intentionally absent. Adding one requires the trigger to be met and an ADR
or doc update.

| Table                              | Trigger for adding it                                        |
| ---------------------------------- | ------------------------------------------------------------ |
| `publication_redirects`            | First slug change of a published article                     |
| `outbox_events` / `scheduled_jobs` | First external delivery requirement (webhook, email, search) |
| `sessions` / refresh tokens        | Authentication phase                                         |
| `event_sessions`, `stages`         | A real event-management requirement                          |
| `category_translations`            | A localized site is approved                                 |
| `comments`, `newsletters`          | Product decision                                             |

## Environment boundaries

- Local Docker data is disposable and never restored into production.
- Production secrets live only in the hosting secret store.
- Backups are encrypted at rest by the provider and tested by a documented
  restore drill before real content exists.

## References

- [ERD](erd.md)
- [Data dictionary](data-dictionary.md)
- [Multi-site isolation](multi-site-data-isolation.md)
- [Multi-site content model](../architecture/multi-site-content-model.md)
- [RBAC](../architecture/rbac.md)
