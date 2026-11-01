# Site Publications

## 1. Overview

A site publication (`post_publications`) represents the presence, configuration, and presentation of a canonical post on an individual website.

Changing one site's publication never alters or affects another site's publication of the same source content.

---

## 2. Key Capabilities & Invariants

### 1. Site-Scoped Slug Independence

Each publication defines its own URL slug.

- Constraint: `UQ_post_publications_site_slug` on `("site_id", "slug")`.
- Identical slugs (e.g. `alps-guide`) can be published on `Travel Blog` and `Air Sports Live` without conflict.
- Duplicate slugs on the same site are rejected with HTTP 409 Conflict (`publication.slugConflict`).

### 2. Single Publication Per Site & Post

A canonical post can have at most one publication per website.

- Constraint: `UQ_post_publications_site_post` on `("site_id", "post_id")`.
- Duplicate publication attempts return HTTP 409 Conflict (`publication.sitePostConflict`).

### 3. Pinned Revisions

Publications explicitly pin a specific revision snapshot ID (`revision_id`).

- When a source post is updated with a new revision, existing published sites continue serving the pinned revision until the site publisher explicitly updates the publication's `revision_id`.

### 4. SEO & Canonical URL Customization

Each site publication configures its own:

- `seo_title`: Site-specific page title for search engines.
- `seo_description`: Meta description snippet.
- `canonical_url`: Custom canonical link tag (`rel="canonical"`), enabling syndication credit back to a primary domain when needed.

### 5. Publication Lifecycle

- Statuses: `draft`, `scheduled`, `published`, `archived`.
- `published_at`: Populated when the publication status transitions to `published`.
- `scheduled_for`: Optional future timestamp for scheduled publication workers.
