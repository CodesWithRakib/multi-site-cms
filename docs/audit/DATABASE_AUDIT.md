# Database Audit

Authoritative design docs: [database/README.md](../database/README.md),
[data-dictionary.md](../database/data-dictionary.md),
[multi-site-data-isolation.md](../database/multi-site-data-isolation.md).

## Verified state

- PostgreSQL 18.6 running locally (container `multi-site-cms-postgres-1`, host
  port 5433).
- 11 TypeORM migrations in `apps/api/src/database/migrations/`, each with a
  `down()`. `synchronize` is false (per AGENTS.md; not re-checked at runtime).
- 24 tables: `users`, `roles`, `permissions`, `role_permissions`,
  `user_role_assignments`, `sessions`, `sites`, `site_domains`, `posts`,
  `post_revisions`, `post_publications`, `post_publication_categories`,
  `post_publication_tags`, `post_publication_media`, `categories`, `tags`,
  `media_assets`, `events`, `audit_events`, `outbox_events`,
  `analytics_page_views`, `platform_settings`, `newsletter_subscribers`,
  `post_comments`.
- 39 `CREATE INDEX` statements across migrations.
- No schema change was made in this session.

## Findings

| ID   | Severity | Finding                                                                                                                                                                                                                                                                               | Recommendation                                                                                                                                                                |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-1 | Medium   | `post_comments` has independent FKs to `sites` and `post_publications`; nothing guarantees `post_comments.site_id` equals the publication's site. ADR-0009 uses composite keys for this kind of invariant. The service sets both from the same lookup, so today's data is consistent. | Phase 2: composite FK `(site_id, publication_id)` → `post_publications(site_id, id)` if that unique key exists; otherwise add it. Reviewed migration with a data check first. |
| DB-2 | Medium   | `post_comments.status` defaults to `'approved'`.                                                                                                                                                                                                                                      | Depends on the moderation decision (SEC-9).                                                                                                                                   |
| DB-3 | Low      | `newsletter_subscribers` has no unsubscribe token or confirmation state.                                                                                                                                                                                                              | Needed only if newsletter sending is in scope.                                                                                                                                |
| DB-4 | Low      | `analytics_page_views` and `audit_events` grow without a documented retention or partitioning policy.                                                                                                                                                                                 | Phase 4: retention job + documented windows.                                                                                                                                  |
| DB-5 | Info     | Personal data stored: commenter name/email/IP (from proxy), subscriber email, `visitor_id`. No data-retention or erasure procedure is documented.                                                                                                                                     | Document in data-ownership.md; add an erasure path when legally required.                                                                                                     |

## Not verified in this session

- Query plans for the hot public queries (`EXPLAIN ANALYZE`).
- Restore drill from a backup (see [migrations-and-recovery.md](../database/migrations-and-recovery.md)).
- Migration `down()` round-trip on a populated database.
