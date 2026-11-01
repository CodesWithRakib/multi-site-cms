# URL Architecture, Slug Stability & Migration

## 1. Canonical URL Structure

The Travel Blog follows a clean, predictable, and search-friendly URL hierarchy:

| Resource Type     | Canonical URL Pattern | Example                             |
| ----------------- | --------------------- | ----------------------------------- |
| Editorial Article | `/articles/:slug`     | `/articles/hidden-fjords-of-norway` |
| Destination Guide | `/articles/:slug`     | `/articles/kyoto-autumn-guide`      |
| Destinations Hub  | `/destinations`       | `/destinations`                     |
| Category Archive  | `/categories/:slug`   | `/categories/solo-travel`           |
| Tag Archive       | `/tags/:slug`         | `/tags/scandinavia`                 |
| Search Page       | `/search?q=:query`    | `/search?q=fjords`                  |

---

## 2. Slug Validation & Invariants

1. **Format Validation**:
   - Slugs must conform to the regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
   - Automatically sanitized: converted to lowercase, accents stripped, non-alphanumeric characters replaced with hyphens, consecutive hyphens collapsed.
2. **Site-Scoped Uniqueness**:
   - Enforced by PostgreSQL composite unique index:
     ```sql
     CREATE UNIQUE INDEX uq_site_publications_site_slug
     ON site_publications (site_id, slug)
     WHERE deleted_at IS NULL;
     ```
   - Different tenant sites (e.g. Travel Blog vs Air Sports) may reuse the same slug without collision.
3. **Decoupled from Titles**:
   - The publication slug is assigned upon publication.
   - Editing the article title in future revisions does not mutate the slug automatically, preserving inbound backlink stability.

---

## 3. Redirect Handling & SEO Equity Preservation

When editorial staff explicitly modify an article's slug:

1. **301 Permanent Redirect**:
   - A permanent HTTP 301 redirect must be registered from the retired slug to the new canonical URL.
   - Prevents link rot and preserves search engine ranking equity.
2. **Historical Slug Registry**:
   - The platform maintains historical publication aliases in the database.
   - When a request arrives for a retired slug, the API informs the client to emit a 301 redirect to the active canonical slug.

---

## 4. Migration from Legacy Systems

When migrating existing external blogs (e.g. WordPress, Ghost, Substack) into the Travel Blog:

1. **Path Normalization**:
   - Legacy patterns like `/2023/05/12/my-post` or `/p/123` are mapped to `/articles/my-post` via Next.js `redirects()` in `next.config.ts` or edge middleware.
2. **Trailing Slash Uniformity**:
   - Trailing slashes are normalized consistently to non-trailing slash endpoints.
3. **Taxonomy Consolidation**:
   - Category and tag names are mapped to unified site-scoped records during bulk import.
