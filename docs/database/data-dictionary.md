# Data dictionary

Schema as implemented by migrations `1793491200000`–`1793491205000`. Types are
PostgreSQL types. "Site-owned" means the row carries `site_id`; "platform" means
it does not.

## users

Global identity. Never site-owned.

| Column                    | Type        | Null | Notes                                     |
| ------------------------- | ----------- | ---- | ----------------------------------------- |
| `id`                      | uuid        | no   | PK, `gen_random_uuid()`                   |
| `email`                   | citext      | no   | Unique, case-insensitive, not blank       |
| `password_hash`           | text        | yes  | Excluded from default `SELECT`            |
| `display_name`            | text        | no   | Non-blank                                 |
| `status`                  | text        | no   | `active`/`invited`/`suspended`/`disabled` |
| `last_login_at`           | timestamptz | yes  |                                           |
| `failed_login_count`      | integer     | no   | `>= 0`, default 0                         |
| `created_at`/`updated_at` | timestamptz | no   | Default `now()`                           |

Invariant: a non-`active` user must be denied by authorization even if a session
row still exists. Deletion is restricted while any content references the user.

## roles

| Column       | Type    | Null | Notes                       |
| ------------ | ------- | ---- | --------------------------- |
| `id`         | uuid    | no   | PK                          |
| `key`        | citext  | no   | Unique, `^[a-z][a-z0-9_]*$` |
| `name`       | text    | no   | Display only                |
| `scope_type` | text    | no   | `platform` or `site`        |
| `is_system`  | boolean | no   | Marks built-in roles        |

Unique `(id, scope_type)` exists solely to let assignments enforce scope with a
foreign key.

## permissions

| Column        | Type   | Null | Notes                                       |
| ------------- | ------ | ---- | ------------------------------------------- |
| `id`          | uuid   | no   | PK                                          |
| `key`         | citext | no   | Unique, `^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$` |
| `description` | text   | no   |                                             |

Authorization checks permission keys. Role keys are never branches in code.

## role_permissions

Join table; PK `(role_id, permission_id)`. `role_id` → `roles` `CASCADE` (an owned
child), `permission_id` → `permissions` `RESTRICT` (a permission in use cannot
vanish). Index on `permission_id` for reverse lookups.

## user_role_assignments

Site access grant. PK `id` (uuid).

| Column       | Type | Null | Notes                                          |
| ------------ | ---- | ---- | ---------------------------------------------- |
| `user_id`    | uuid | no   | → `users` RESTRICT                             |
| `role_id`    | uuid | no   | Composite with `scope_type` → `roles` RESTRICT |
| `scope_type` | text | no   | Must match the role's scope                    |
| `site_id`    | uuid | yes  | → `sites` RESTRICT; required for site scope    |
| `created_by` | uuid | yes  | → `users` SET NULL                             |

Constraints: `CHK_user_role_assignments_scope` ties `scope_type` to `site_id`;
partial unique indexes prevent duplicate platform grants and duplicate per-site
grants. An Admin's reachable sites are the distinct `site_id` values here.

## sites

| Column           | Type   | Null | Notes                                                     |
| ---------------- | ------ | ---- | --------------------------------------------------------- |
| `id`             | uuid   | no   | PK                                                        |
| `key`            | citext | no   | Unique, immutable, `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$` |
| `name`           | text   | no   | Non-blank                                                 |
| `default_locale` | text   | no   | Default `en`, BCP-47-ish format check                     |
| `timezone`       | text   | no   | Default `UTC`, used for display only                      |
| `status`         | text   | no   | `active`/`paused`/`archived`                              |
| `settings`       | jsonb  | no   | Non-secret presentation config, object only               |
| `created_by`     | uuid   | yes  | → `users` SET NULL                                        |

`settings` must never hold authorization facts, secrets, or billing state.

## site_domains

| Column        | Type        | Null | Notes                                       |
| ------------- | ----------- | ---- | ------------------------------------------- |
| `site_id`     | uuid        | no   | → `sites` RESTRICT                          |
| `hostname`    | citext      | no   | Globally unique, lowercase, normalized      |
| `status`      | text        | no   | `active`/`disabled`                         |
| `is_primary`  | boolean     | no   | At most one per site (partial unique index) |
| `verified_at` | timestamptz | yes  | Set by the future verification workflow     |

Normalization rules: lowercase, no scheme, no port, no path, no trailing dot. The
check constraint enforces the character set and lowercase form, but not
"is a real registered domain" — that is a verification concern, and a row alone is
not proof of ownership.

## categories

Site-owned. Columns: `id`, `site_id` (→ `sites` CASCADE), `slug` (citext),
`name`, `description`, `parent_id` (→ `categories(id, site_id)` SET NULL),
`display_order` (integer, default 0), `is_active` (boolean, default true), timestamps.

Unique `(site_id, slug)` and `(id, site_id)`; slug format `^[a-z0-9]+(-[a-z0-9]+)*$`,
length 1–96. Foreign key `FK_categories_parent` guarantees that parent categories belong
to the same site. Circular loops and self-referencing are validated and prevented.

## tags

Site-owned keyword metadata. Columns: `id`, `site_id` (→ `sites` CASCADE), `slug` (citext),
`name`, `description` (text, nullable), timestamps. Unique `(site_id, slug)`.

Both tables are site-owned because a shared taxonomy would need a visibility model
to prevent one publication's categories appearing in another's navigation.

## events

Site-owned live event. Columns: `id`, `site_id` (→ `sites` CASCADE), `slug`,
`name`, `status` (`scheduled`/`live`/`completed`/`cancelled`), `starts_at`,
`ends_at`, `description`, timestamps.

`CHK_events_time_range` requires `ends_at >= starts_at`. Unique `(site_id, slug)`
and `(id, site_id)`; index `(site_id, starts_at)`.

No sessions, stages, or participants: a live update is a publication of type
`live_update` with `event_id` set. That keeps ordering and content in one place.

## posts

Canonical content identity. Platform-owned; deliberately **no** `site_id`.

| Column          | Type        | Null | Notes                                                                                    |
| --------------- | ----------- | ---- | ---------------------------------------------------------------------------------------- |
| `author_id`     | uuid        | no   | → `users` RESTRICT                                                                       |
| `type`          | text        | no   | `article`/`guide`/`news`/`live_update`/`travel_guide`/`air_sports_update`/`event_update` |
| `status`        | text        | no   | `draft`/`in_review`/`approved`/`archived`                                                |
| `source_locale` | text        | no   | Default `'en'`                                                                           |
| `deleted_at`    | timestamptz | yes  | Soft delete; must be filtered in every read                                              |

`post.status` is the editorial state of the content; publication state is per
site. They are separate on purpose: content can be approved but unpublished, and
published to one site while still a draft elsewhere.

## post_revisions

Immutable snapshot. Platform-owned.

| Column            | Type    | Null | Notes                                  |
| ----------------- | ------- | ---- | -------------------------------------- |
| `post_id`         | uuid    | no   | → `posts` CASCADE                      |
| `revision_number` | integer | no   | `>= 1`, unique per post                |
| `title`           | text    | no   | Non-blank                              |
| `excerpt`         | text    | yes  |                                        |
| `body`            | jsonb   | no   | Tiptap document; must be a JSON object |
| `change_summary`  | text    | yes  |                                        |
| `created_by`      | uuid    | no   | → `users` RESTRICT                     |

Unique `(post_id, revision_number)` and `(post_id, id)`. The second key exists so
a publication can pin a revision with a composite foreign key. Rows are never
updated after insert; restoring history inserts a new revision.

JSONB trade-off: the body is opaque to SQL (no per-node queries without JSON path
operators), but it keeps the editor document intact and avoids a node table that
would be rewritten on every keystroke. Search will use a separate plain-text
projection when it is implemented, not `ILIKE` over JSONB.

## post_publications

The tenant-visible unit. Site-owned.

| Column              | Type        | Null | Notes                                            |
| ------------------- | ----------- | ---- | ------------------------------------------------ |
| `site_id`           | uuid        | no   | → `sites` RESTRICT                               |
| `post_id`           | uuid        | no   | → `posts` RESTRICT                               |
| `revision_id`       | uuid        | no   | Composite `(post_id, revision_id)` → revisions   |
| `event_id`          | uuid        | yes  | Composite `(event_id, site_id)` → events         |
| `slug`              | citext      | no   | Unique per site, `^[a-z0-9]+(-[a-z0-9]+)*$`      |
| `status`            | text        | no   | `draft`/`scheduled`/`published`/`archived`       |
| `scheduled_for`     | timestamptz | yes  | Required when `status = 'scheduled'`             |
| `published_at`      | timestamptz | yes  | Required when `status = 'published'`             |
| `seo_title`         | text        | yes  | `<= 200` characters                              |
| `seo_description`   | text        | yes  | `<= 320` characters                              |
| `canonical_url`     | text        | yes  | Absolute `http(s)://`                            |
| `featured_image_id` | uuid        | yes  | Composite `(featured_image_id, site_id)` → media |
| `template_key`      | text        | yes  | Allowlisted key, `^[a-z][a-z0-9-]{0,63}$`        |

Unique `(site_id, post_id)`, `(site_id, slug)`, `(id, site_id)`. Indexes:
`(site_id, status, published_at)`, partial `(scheduled_for) WHERE status =
'scheduled'`, partial `(event_id, published_at) WHERE event_id IS NOT NULL`.

Invariants: one publication per post per site in v1; a slug stays reserved even
when archived; `template_key` selects a renderer and is never a file path or
component name.

## post_publication_categories / post_publication_tags

Junction rows with `publication_id`, `category_id`/`tag_id`, and `site_id`, all
part of the primary key. Both foreign keys are composite and include `site_id`, so
the database itself rejects a cross-site assignment. `publication` deletion
cascades; deleting a category or tag in use is restricted.

## media_assets

Metadata only; bytes live in object storage.

| Column              | Type        | Null | Notes                                       |
| ------------------- | ----------- | ---- | ------------------------------------------- |
| `site_id`           | uuid        | yes  | `NULL` only for Super Admin platform assets |
| `uploaded_by`       | uuid        | yes  | → `users` SET NULL                          |
| `storage_provider`  | text        | no   | `local` initially, then a provider slug     |
| `storage_key`       | text        | no   | Unique, opaque, never a user filename       |
| `original_filename` | text        | yes  | Original file name at upload time           |
| `mime_type`         | text        | no   | `type/subtype` format                       |
| `byte_size`         | bigint      | no   | `> 0`                                       |
| `checksum`          | text        | no   | 32–128 characters (SHA-256 hex)             |
| `width`/`height`    | integer     | yes  | Both set or both null, `> 0`                |
| `alt_text`          | text        | yes  | Accessibility text                          |
| `caption`           | text        | yes  |                                             |
| `status`            | text        | no   | `active`/`archived`                         |
| `deleted_at`        | timestamptz | yes  | Soft delete pending storage cleanup         |

Never stored: provider credentials, signed upload/download URLs, temporary tokens.
A signed URL is a capability, not an identifier.

## post_publication_media

Usage relation: `publication_id`, `media_id`, `site_id`, `role`
(`featured`/`gallery`/`inline`/`attachment`), `position` (`>= 0`). Unique
`(publication_id, media_id, role)`. Both composite foreign keys include `site_id`.
Referenced media cannot be hard-deleted (`RESTRICT`), which is what makes the
"delete an asset in use" check reliable.

## audit_events

Append-only. Platform-owned with an optional site scope.

| Column        | Type   | Null | Notes                                      |
| ------------- | ------ | ---- | ------------------------------------------ |
| `id`          | bigint | no   | Identity PK (documented exception)         |
| `actor_id`    | uuid   | yes  | → `users` SET NULL                         |
| `actor_type`  | text   | no   | `user`/`system`/`bootstrap`                |
| `site_id`     | uuid   | yes  | → `sites` SET NULL                         |
| `action`      | text   | no   | `namespace.verb`, e.g. `site.created`      |
| `entity_type` | text   | no   |                                            |
| `entity_id`   | uuid   | yes  |                                            |
| `request_id`  | text   | yes  | Correlates with the API `X-Request-Id`     |
| `ip_address`  | inet   | yes  | PostgreSQL `inet`, not text                |
| `metadata`    | jsonb  | no   | Object only; no secrets or unnecessary PII |

Checks: a `user` actor requires `actor_id`; other actor types must not pretend to
be a user. Indexes: `(site_id, created_at)`, `(actor_id, created_at)`,
`(action, created_at)`, `(entity_type, entity_id)`.

Append-only is enforced by privileges, not constraints: the application role gets
`INSERT` and `SELECT` only. See
[multi-site isolation](multi-site-data-isolation.md#audit-tampering).
