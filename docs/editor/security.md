# Editorial & Media Security Architecture

## Security Objectives

1. Prevent disguised executable uploads and polyglot files from compromising hosting environments.
2. Prevent Stored Cross-Site Scripting (XSS) via rich text markup, embeds, or SVG media.
3. Enforce multi-tenant access boundaries so unauthorized site editors cannot upload media or view drafts for unauthorized sites.
4. Guarantee draft previews cannot leak into public search engine indexes.

## Security Controls Implemented

| Threat Vector                   | Implemented Defense Mechanism                                                                                                                                                                    |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Disguised Executable Upload** | Server-side magic byte inspection inspecting raw buffer headers for PNG, JPEG, GIF, WebP, AVIF, PDF, and MP4 signatures. Files failing signature inspection are rejected with `400 BAD REQUEST`. |
| **MIME Spoofing**               | Client-declared `Content-Type` headers are ignored. True MIME types are resolved from verified magic byte signatures.                                                                            |
| **SVG Stored XSS**              | Embedded `<script>`, `<iframe>`, `onload=`, and `javascript:` URIs are parsed and stripped before saving to disk.                                                                                |
| **Path Traversal Attacks**      | Storage keys are sanitized and checked with `path.resolve` against `uploads/` root boundaries to block `../` directory escapes.                                                                  |
| **Draft Preview Scraping**      | 15-minute cryptographic HMAC-SHA256 preview tokens + mandatory `X-Robots-Tag: noindex, nofollow` HTTP response headers.                                                                          |
| **Cross-Tenant Enumeration**    | When an editor attempts to target an unauthorized site ID, the backend returns opaque `404 Not Found` rather than `403 Forbidden` to prevent resource probing.                                   |
| **CSRF Exploitation**           | Double-submit CSRF tokens are mandatory on all multipart uploads, preview token creation, and post mutation routes.                                                                              |
| **Concurrent Edit Overwrite**   | Optimistic Concurrency Control (OCC) revision checking returns `409 Conflict` if the database revision differs from `expectedRevisionNumber`.                                                    |
