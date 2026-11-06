# Publishing Lifecycle & State Machine

## Overview

The `multi-site-cms` publishing engine enforces a formal, deterministic state machine governing the life cycle of every content publication across independent sites. Rather than treating publication as a binary flag, every `PostPublication` record traverses explicitly defined and validated lifecycle states.

---

## Publication States

The system establishes five canonical publication statuses:

| Status      | Name      | Description                                                                             | Visibility                  |
| ----------- | --------- | --------------------------------------------------------------------------------------- | --------------------------- |
| `draft`     | Draft     | Initial creation or restored content. Work-in-progress editorial state.                 | Internal Only (Unpublished) |
| `in_review` | In Review | Content submitted by authors for editorial review and approval before release.          | Internal Only (Unpublished) |
| `scheduled` | Scheduled | Content verified and queued for automatic publishing at a precise future UTC instant.   | Internal Only (Unpublished) |
| `published` | Published | Publicly visible and accessible on the assigned target site.                            | Publicly Accessible         |
| `archived`  | Archived  | Content removed from active publication while retaining revision history and analytics. | Internal Only (Unpublished) |

---

## Allowed Transition Matrix

Transitions are centrally defined and validated. Any transition request outside this matrix is rejected with an HTTP `400 Bad Request` (`VALIDATION_ERROR` with code `publication.invalidTransition`):

```
+------------+       submitForReview       +---------------+
|   DRAFT    | --------------------------> |   IN_REVIEW   |
+------------+                             +---------------+
  ^        ^                                 |           |
  |        |                                 |           |
  | unpublish / cancelSchedule / restore     |           |
  |        |                                 |           |
  |        |                                 v           v
  |  +-----------+    schedulePublication  +---------------+
  |  | SCHEDULED | <---------------------- |   PUBLISHED   | <---+
  |  +-----------+                         +---------------+     |
  |        |                                 |                   |
  |        | worker execution                | archive           |
  |        +-------------------------------->+                   |
  |                                          v                   |
  |                                    +---------------+         |
  +------------------------------------|   ARCHIVED    |         |
                                       +---------------+         |
                                                                 |
                                       publishImmediately        |
                                       (from draft or in_review) |
                                       +-------------------------+
```

### Transition Rules

| From State  | Allowed Target States                             | Permitted Operations                                                                | Required Permissions                                                                |
| ----------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `draft`     | `in_review`, `scheduled`, `published`, `archived` | `review`, `schedule`, `publish`, `archive`                                          | `post:update`, `publication:schedule`, `publication:publish`, `publication:archive` |
| `in_review` | `draft`, `scheduled`, `published`, `archived`     | `unpublish`, `schedule`, `publish`, `archive`                                       | `post:update`, `publication:schedule`, `publication:publish`, `publication:archive` |
| `scheduled` | `draft`, `published`, `archived`                  | `cancel-schedule`, `reschedule` (updates timestamp), worker auto-publish, `archive` | `publication:schedule`, `publication:archive`                                       |
| `published` | `draft`, `archived`                               | `unpublish` (returns to draft), `archive`                                           | `publication:archive`                                                               |
| `archived`  | `draft`                                           | `restore` (returns to draft)                                                        | `publication:archive`                                                               |

---

## Pre-Publication Eligibility Invariants

Before any publication can transition to `published` or `scheduled`, the `PublishingService` performs atomic pre-condition validation:

1. **Active Target Site**: The target `Site` must exist and possess `status = 'active'`. Deactivated or suspended sites cannot receive published or scheduled content.
2. **Approved Post Status**: The root `Post` entity must have `status = 'approved'` (or `'published'`). Draft or rejected posts cannot be published.
3. **Valid Pinned Revision**: The pinned `revisionId` on the `PostPublication` must resolve to an immutable `PostRevision` record belonging to that exact post (`post_revisions.post_id = post_publications.post_id`).
4. **Mandatory Title & Non-Empty Document**: The revision must have a non-empty trimmed `title` and a valid JSONB editor `body` object.
5. **Slug Collision Integrity**: The publication slug must remain unique within the assigned `site_id`, guarded by database index `UQ_post_publications_site_slug`.

---

## Which revision goes live (ADR-0005)

Editing a post creates a new revision; a publication is a pin to one
revision. The pin moves only on an explicit publishing action:

| Action                                                | Pinned revision                                               |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `publish` (Publish Now)                               | The post's latest revision at that moment                     |
| `schedule` / `reschedule`                             | The latest revision when scheduled; the worker ships that pin |
| `update-live` (`POST …/publications/:id/update-live`) | Moves a `published` pin to the latest revision                |

`update-live` requires `publication:publish`, works only on `published`
publications (`400 publication.notPublished` otherwise), keeps the slug and
`publishedAt`, and is a no-op when the pin is already current. It emits a
`publication.updated` outbox event, which revalidates the site cache but is not
re-broadcast to the Air Sports realtime stream (an edit is not a new live
update). In the admin editor, a published site card shows **Update live**
whenever the post has newer saved edits than the live version.

---

## Backend Security & Authorization

All lifecycle transitions occur through authenticated, CSRF-protected NestJS endpoints guarded by `AuthGuard` and `PermissionsGuard`:

- **Platform Isolation**: Super Admins possess platform-wide capabilities across all sites.
- **Tenant Scope Enforcement**: Site Admins are strictly scoped to their assigned `site_id`. An attempt by a Site Admin to publish or schedule content belonging to another site yields an immediate `403 Forbidden` (`FORBIDDEN`).
- **Audit Trail Guarantee**: Every transition writes an immutable audit record to `audit_logs` capturing `actorId`, `siteId`, `action`, `entityId`, `previousStatus`, and `newStatus` inside the same database transaction.
