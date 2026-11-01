# ADR-0018: CMS Core Content, Publications, Revisions & Taxonomy Architecture

- Status: Accepted
- Date: 2026-11-01
- Owners: Application Security Lead, Backend Platform Architect, CMS Core Engineer

## Context

The platform manages multiple independent public websites (beginning with Travel Blog and Air Sports Live Updates) from a unified headless API service. Editorial operations require publishing content across single or multiple websites while allowing site-specific customization (slugs, SEO metadata, canonical URLs, featured images, and category/tag associations) without duplicating core editorial body records.

Without an explicit structural separation:

1. Cross-site syndication would lead to data duplication, conflicting revision histories, and synchronization drift.
2. Concurrent editorial edits by multiple team members could silently overwrite newer revisions (lost updates).
3. Circular category hierarchies could trigger infinite recursion during taxonomy tree walks.
4. Client Admins could tamper with publication settings or taxonomy across unauthorized tenant sites (IDOR vulnerability).
5. Media assets actively used as featured images could be deleted, causing broken references and 404 image errors on public publication frontends.

## Decision

We implement a decoupled **Canonical Content and Independent Site Publication** architecture:

```
[Canonical Post: `posts`] (Site-Neutral)
       │
       ├── 1:N ──> [Immutable Revision History: `post_revisions`]
       │
       └── 1:N ──> [Independent Site Publications: `post_publications`] (Site-Scoped)
                         │
                         ├── M:N ──> `categories` (via `post_publication_categories`)
                         ├── M:N ──> `tags` (via `post_publication_tags`)
                         └── 1:1 ──> `media_assets` (via `featured_image_id`)
```

### 1. Canonical Post & Immutable Revision Engine

- Canonical content lives in `posts` with site-neutral metadata (`author_id`, `type`, `status`, `source_locale`, `deleted_at`, `created_at`, `updated_at`). Supported content types include `article`, `guide`, `news`, `live_update`, `travel_guide`, `air_sports_update`, and `event_update`.
- Editorial content (`title`, `excerpt`, structured editor JSON `body`, `change_summary`) is stored in immutable, append-only `post_revisions`.
- Restoring a historical revision never rewrites or deletes existing revision snapshots; instead, it creates a new, monotonically incremented revision snapshot containing the historical content.
- Optimistic Concurrency Control (OCC) is enforced on post updates via `expectedRevisionNumber`. If a concurrent edit has advanced the revision number, the request fails immediately with HTTP 409 Conflict (`CONFLICT`, `post.versionConflict`), preventing lost updates.

### 2. Structured Body Document Validation

- Editorial body content is modeled as structured editor JSON (`{ type: 'doc', content: [...] }`), decoupling the persistence model from any single frontend editor framework.
- The backend recursively validates AST structure, bounds nesting depth (maximum 32 levels), and sanitizes URL schemes. Any occurrence of dangerous pseudo-protocols (`javascript:`, `data:`, `vbscript:`) is strictly rejected with HTTP 400 Bad Request (`VALIDATION_ERROR`, `post.invalidBody`).

### 3. Independent Multi-Site Publications

- One canonical post can be published to multiple sites independently through `post_publications`.
- Each publication maintains its own site-scoped slug (`UQ_post_publications_site_slug`), publication status (`draft`, `scheduled`, `published`, `archived`), publication timestamps (`published_at`, `scheduled_for`), SEO overrides (`seo_title`, `seo_description`), canonical URL override (`canonical_url`), template key (`template_key`), and pinned revision reference (`revision_id`).
- Slugs are unique per site (`site_id, slug`), allowing identical slugs to coexist across separate websites without collision.
- A post can only have one publication per site (`UQ_post_publications_site_post`).

### 4. Site-Scoped Hierarchical Taxonomy

- Categories (`categories`) are site-scoped with parent-child hierarchical support (`parent_id`, `display_order`, `is_active`). Foreign key constraint `FK_categories_parent` enforces composite isolation on `(parent_id, site_id)`.
- Circular parent-child references (A -> B -> A) and self-references are detected and prevented via `validateCategoryHierarchy`, returning HTTP 400 Bad Request (`VALIDATION_ERROR`, `category.cycleDetected`).
- Tags (`tags`) are site-scoped keywords with unique slugs per site (`site_id, slug`).
- Publications associate with categories and tags through dedicated join tables (`post_publication_categories`, `post_publication_tags`), ensuring all associated taxonomy terms belong strictly to the publication's site.

### 5. Media Metadata Foundation & Active Usage Safeguards

- Media metadata (`media_assets`) tracks uploaded assets without storing binary streams in the database (`mime_type`, `byte_size`, `checksum`, `storage_provider`, `storage_key`, `original_filename`, `width`, `height`, `alt_text`, `caption`).
- MIME types are strictly restricted to approved image, document, audio, and video formats. Executable and script formats are rejected with HTTP 400 Bad Request (`media.invalidMimeType`).
- Active usage protection prevents soft-deleting media assets that are currently assigned as a publication's featured image or gallery reference, returning HTTP 400 Bad Request (`VALIDATION_ERROR`, `media.cannotDeleteInUse`).

### 6. Strict Multi-Tenant Authorization & IDOR Protection

- Site access is governed by the caller's `EffectiveAuthContext`. Super Admins possess platform-wide capabilities. Client Admins can access and manage only explicitly assigned websites (`authorizedSiteIds`).
- Any attempt by a Client Admin to read, modify, or create resources on an unassigned site returns HTTP 404 NOT FOUND, completely preventing tenant resource existence leakage.
- All write operations record immutable audit events (`post.create`, `post.update`, `post.delete`, `publication.create`, `publication.publish`, `publication.update`, `publication.archive`, `category.create`, `category.update`, `category.delete`, `tag.create`, `tag.update`, `tag.delete`, `media.create`, `media.update`, `media.delete`).

## Consequences

### Positive

- Cross-site syndication is clean: one canonical post has independent publication lifecycles, URLs, and SEO settings per website.
- Concurrency conflicts are gracefully handled through explicit version conflict errors rather than silent data corruption.
- Complete revision audit trail allows safe rollbacks at any point in time.
- Hierarchies are cycle-free and site-isolated by construction.
- Client Admin tampering is completely blocked by backend guards and opaque 404 responses.

### Negative & Mitigations

- Querying a post with its current revision requires joining `post_revisions` or executing a secondary indexed query by `(post_id, revision_number DESC)`. Mitigated by composite index `IDX_post_revisions_post_rev`.
- Deleting an asset requires inspecting foreign references (`post_publications.featured_image_id` and `post_publication_media`). Mitigated by fast index lookups.

## References

- ADR-0005: Canonical Content & Publications Model
- ADR-0009: Site-Scoped Taxonomy & Composite Keys
- ADR-0010: Media Metadata & Storage Abstraction
- ADR-0016: Session-Based Authentication & RBAC
- ADR-0017: Multi-Site Configuration & Domain Registry
