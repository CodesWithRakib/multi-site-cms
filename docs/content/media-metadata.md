# Media Metadata Foundation

## 1. Overview

The `media_assets` entity tracks asset metadata and ownership without storing raw binary streams directly in PostgreSQL. Binary storage is decoupled via abstract storage providers (`storage_provider`, `storage_key`) such as local filesystem or cloud object stores (S3, Cloudflare R2).

---

## 2. Media Model & Schema

| Field               | Type                      | Description                                     |
| ------------------- | ------------------------- | ----------------------------------------------- |
| `id`                | `uuid` (PK)               | Media identifier                                |
| `site_id`           | `uuid` (FK, nullable)     | Scoped site, or `null` for platform-wide assets |
| `uploaded_by`       | `uuid` (FK -> `users.id`) | User who registered the asset                   |
| `storage_provider`  | `text`                    | Provider identifier (`local`, `s3`, `r2`)       |
| `storage_key`       | `text`                    | Unique opaque path/key in storage               |
| `original_filename` | `text` (nullable)         | Source upload filename                          |
| `mime_type`         | `text`                    | MIME format (e.g. `image/jpeg`, `image/webp`)   |
| `byte_size`         | `bigint`                  | Byte size of the asset file                     |
| `checksum`          | `text`                    | SHA-256 hash verifying integrity                |
| `width`             | `integer` (nullable)      | Pixel width for image assets                    |
| `height`            | `integer` (nullable)      | Pixel height for image assets                   |
| `alt_text`          | `text` (nullable)         | Accessibility description                       |
| `caption`           | `text` (nullable)         | Editorial caption                               |
| `status`            | `text`                    | `active`, `processing`, `archived`              |
| `deleted_at`        | `timestamptz` (nullable)  | Soft-deletion timestamp                         |

---

## 3. Security & Integrity Controls

### MIME Type Allowlist

Media registration restricts allowed formats to standard web media:

- Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`, `image/avif`
- Documents: `application/pdf`
- Audio: `audio/mpeg`, `audio/wav`
- Video: `video/mp4`, `video/webm`
  Executables, scripts, HTML, and binary payloads (`.exe`, `.bat`, `.js`, `.sh`) are blocked with HTTP 400 Bad Request (`media.invalidMimeType`).

### Deletion Protection for Active Assets

Before soft-deleting an asset (`DELETE /api/v1/media/:mediaId`), the service checks:

1. `post_publications.featured_image_id`: Whether any publication references this asset as its featured image.
2. `post_publication_media`: Whether any publication references this asset in inline content or gallery relationships.
   If any active reference exists, deletion is rejected with HTTP 400 Bad Request (`media.cannotDeleteInUse`).
