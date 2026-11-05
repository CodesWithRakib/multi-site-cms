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

| ID   | Severity | Finding                                                                                                                                                                                                                                                                               | Recommendation                                                                                                                                                          |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DB-1 | Medium   | `post_comments` has independent FKs to `sites` and `post_publications`; nothing guarantees `post_comments.site_id` equals the publication's site. ADR-0009 uses composite keys for this kind of invariant. The service sets both from the same lookup, so today's data is consistent. | Fixed: `FK_post_comments_publication_site` in migration `1793491211000` (pre-check aborts on bad rows; down() verified).                                                |
| DB-2 | Medium   | `post_comments.status` defaults to `'approved'`.                                                                                                                                                                                                                                      | Fixed: default `'pending'` (same migration); existing rows unchanged.                                                                                                   |
| DB-3 | Low      | `newsletter_subscribers` has no unsubscribe token or confirmation state.                                                                                                                                                                                                              | Needed only if newsletter sending is in scope.                                                                                                                          |
| DB-4 | Low      | `analytics_page_views` and `audit_events` grow without a documented retention or partitioning policy.                                                                                                                                                                                 | Fixed (Phase 4): `RetentionJob`, env windows, advisory lock; see data-ownership.md                                                                                      |
| DB-5 | Info     | Personal data stored: commenter name/email/IP (from proxy), subscriber email, `visitor_id`. No data-retention or erasure procedure is documented.                                                                                                                                     | Document in data-ownership.md; add an erasure path when legally required.                                                                                               |
| DB-6 | High     | Migration `1793491207000` inserted ~90 days of random page views for every site that existed when it ran. On the development database all 4,468 page views are generated (identified by the migration record `xmin`), so the analytics dashboard showed fabricated traffic.           | Fixed for new installs (insert removed, schema unchanged). Existing databases: operator runs `db:cleanup:generated-analytics` (dry run, then `--apply` after a backup). |
| DB-7 | Low      | Newsletter subscribe was find-then-insert (unique-violation 500 under concurrency) and copied the email into the append-only audit log.                                                                                                                                               | Fixed (Phase 6): atomic upsert; audit stores the subscriber id only                                                                                                     |

## Not verified in this session

- Query plans for the hot public queries (`EXPLAIN ANALYZE`).
- Restore drill from a backup (see [migrations-and-recovery.md](../database/migrations-and-recovery.md)).
- Migration `down()` round-trip on a populated database.
