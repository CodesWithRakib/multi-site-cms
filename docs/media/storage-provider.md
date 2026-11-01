# Storage Provider Abstraction & Asset Streaming

## Overview

The CMS decouples file persistence from business logic through a typed provider pattern (`StorageProvider`). The default implementation uses local disk storage (`LocalStorageProvider`), with zero coupling that prevents switching to Amazon S3, Cloudflare R2, or Google Cloud Storage in cloud deployments.

## Storage Provider Interface

```typescript
export interface UploadedFilePayload {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface StoredFileResult {
  storageKey: string;
  checksumSha256: string;
  sizeBytes: number;
}

export interface StorageProvider {
  store(file: UploadedFilePayload, siteSlug: string): Promise<StoredFileResult>;
  getStream(storageKey: string): Promise<NodeJS.ReadableStream>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): string;
}
```

## Local Storage Provider (`local-storage.provider.ts`)

- **Partitioned Directory Structure**: Assets are organized by tenant and date:
  ```
  uploads/
  └── <site-slug>/
      └── <year>/
          └── <month>/
              └── <uuid>-<safe-filename>
  ```
- **Checksum Calculation**: Every stored asset calculates a SHA-256 hash (`crypto.createHash('sha256')`) to verify bit integrity and detect deduplicated payloads.
- **Path Traversal Protection**: All requested storage keys are validated against directory traversal attacks (`..`, `\`, null bytes):
  ```typescript
  const resolved = path.resolve(this.baseUploadDir, storageKey);
  if (!resolved.startsWith(this.baseUploadDir)) {
    throw new BadRequestException('Invalid storage key path traversal');
  }
  ```

## Safe Asset Serving Route (`GET /api/v1/media/assets/*`)

The NestJS controller provides a streaming route with security-hardened HTTP headers:

- **`X-Content-Type-Options: nosniff`**: Prevents browsers from MIME-sniffing away from the declared Content-Type.
- **`Cache-Control: public, max-age=31536000, immutable`**: Assets have content-addressed immutable keys, enabling 1-year browser/CDN caching.
- **`Content-Disposition: inline; filename="..."`**: Allows in-browser rendering for media while setting clean download filenames.
- **`X-Robots-Tag: noindex`**: For staging/draft attachments where public search indexing should be suppressed.
