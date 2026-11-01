# Content API Reference

## 1. Overview

The Content API exposes RESTful endpoints under `/api/v1/posts`, `/api/v1/sites/:siteId/publications`, `/api/v1/sites/:siteId/categories`, `/api/v1/sites/:siteId/tags`, and `/api/v1/media`.

All endpoints require authentication via session cookie (`cms_session`), CSRF validation (`x-csrf-token`), and role-based permissions (`RequirePermissions`).

---

## 2. Canonical Posts (`/api/v1/posts`)

### `POST /api/v1/posts`

Creates a new canonical post and its initial revision snapshot (Revision #1). Optionally creates initial site publications.

- **Permission**: `post:create`
- **Request Body**:
  ```json
  {
    "title": "Annapurna Expedition Guide",
    "excerpt": "A high-altitude trekking guide.",
    "type": "travel_guide",
    "sourceLocale": "en",
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [{ "type": "text", "text": "Route details and safety precautions." }]
        }
      ]
    },
    "publications": [
      {
        "siteId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "slug": "annapurna-guide",
        "status": "draft"
      }
    ]
  }
  ```
- **Response**: `201 Created` with `ApiSuccess<PostItem>`.

### `GET /api/v1/posts`

Lists canonical posts with pagination, search, and type filtering.

- **Permission**: `post:read`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `type`: Filter by content type (`article`, `travel_guide`, `air_sports_update`, etc.)
  - `status`: Filter by status (`draft`, `in_review`, `approved`, `archived`)
  - `siteId`: Filter posts published on a specific site
  - `search`: Case-insensitive title and excerpt search
  - `sortBy`: `createdAt` or `updatedAt`
  - `sortOrder`: `ASC` or `DESC`

### `GET /api/v1/posts/:postId`

Retrieves a single canonical post by ID, including its current revision and publications.

- **Permission**: `post:read`

### `PATCH /api/v1/posts/:postId`

Updates a canonical post. Supports Optimistic Concurrency Control (OCC). If editorial content (`title`, `excerpt`, or `body`) changed, creates a new revision snapshot.

- **Permission**: `post:update`
- **Request Body**:
  ```json
  {
    "expectedRevisionNumber": 1,
    "title": "Annapurna Expedition: Updated Route Guide",
    "changeSummary": "Added winter hazard warnings"
  }
  ```
- **Response**: `200 OK` with `ApiSuccess<PostItem>`. Returns `409 Conflict` if `expectedRevisionNumber` does not match the latest revision.

### `DELETE /api/v1/posts/:postId`

Soft-deletes a post (`deleted_at = now()`, status `archived`), and archives all associated publications in the same transaction.

- **Permission**: `post:delete`
- **Response**: `204 No Content`.

### `POST /api/v1/posts/:postId/restore`

Restores an archived post (`deleted_at = null`, status `draft`). Restricted to platform Super Admins.

- **Permission**: `post:delete` (Super Admin only)

---

## 3. Revision History (`/api/v1/posts/:postId/revisions`)

### `GET /api/v1/posts/:postId/revisions`

Lists all historical revision snapshots in descending revision number order.

- **Permission**: `post:read`

### `GET /api/v1/posts/:postId/revisions/:revisionNumber`

Fetches exact snapshot data for a specific revision number.

- **Permission**: `post:read`

### `POST /api/v1/posts/:postId/revisions/:revisionNumber/restore`

Restores a historical revision by cloning its snapshot content into a new, incremented revision snapshot.

- **Permission**: `post:update`
- **Request Body**:
  ```json
  {
    "changeSummary": "Rollback to revision #1 before inaccurate route edit"
  }
  ```
- **Response**: `201 Created` with `ApiSuccess<PostRevisionItem>`.

---

## 4. Publications (`/api/v1/sites/:siteId/publications`)

### `POST /api/v1/posts/:postId/publications`

Creates a publication of a canonical post on a specific website.

- **Permission**: `publication:publish`

### `GET /api/v1/sites/:siteId/publications`

Lists publications belonging to a specific site.

- **Permission**: `post:read`

### `GET /api/v1/sites/:siteId/publications/:publicationId`

Retrieves publication details, including attached category and tag IDs.

- **Permission**: `post:read`

### `PATCH /api/v1/sites/:siteId/publications/:publicationId`

Updates publication settings, slug, SEO tags, pinned revision, or attached categories/tags.

- **Permission**: `publication:publish`

### `DELETE /api/v1/sites/:siteId/publications/:publicationId`

Unpublishes and archives a publication.

- **Permission**: `publication:archive`
