# ADR-0019: Tiptap Rich Text Editor, Media Upload Pipeline and Preview System

- Status: Accepted
- Date: 2026-11-01
- Owners: Application Security Engineer, Frontend Architect, Backend Engineer

## Context

Phase 06 delivered the CMS core database entities, publication mechanics, revision history, and taxonomy models. However, authors and editors required:

1. An interactive, extensible, headless rich text editor capable of producing structured JSON content for distinct public websites (Travel Blog and Air Sports).
2. A secure binary media upload system with file validation, magic byte checking, and storage abstraction.
3. Autosave with draft recovery and optimistic concurrency control (OCC).
4. An authenticated preview system to view unpublished drafts safely.

## Decision

1. **Adopt Tiptap 3 / ProseMirror as the Editor Engine**:
   - Keep editor implementation headless and unstyled, decoupled from the branding of individual publication sites.
   - Separate React Server Components (outside the interactive boundary) from Client Components (`PostForm`, `RichTextEditor`).
   - Store editor state locally within Tiptap's ProseMirror instance; keep surrounding form state in React state; manage server state and caching via RTK Query without duplicating into Redux slices.
   - Implement custom block nodes (`DestinationInfoBlock`, `EventTimelineBlock`, `CalloutBlock`) with typed schemas and JSON serialization matching backend validation schemas.

2. **Implement Multi-Layer Media Upload & Storage Abstraction**:
   - Provide `StorageProvider` interface with `LocalStorageProvider` for local environments and future cloud provider extensibility.
   - Perform server-side magic byte inspection (PNG, JPEG, GIF, WebP, AVIF, PDF, MP4) and reject disguised executables with `400 BAD REQUEST`.
   - Sanitize all SVG files to strip scripts, event handlers, and dangerous URIs.
   - Enforce path traversal protection and serve uploaded media with `X-Content-Type-Options: nosniff` and long-term cache headers.

3. **Implement Resilient Autosave and Draft Recovery**:
   - Autosave with 2500ms debounce, real-time status indicators, and offline handling.
   - Mirror drafts into `sessionStorage` (`cms_draft_<postId>`) with restoration banners and `beforeunload` unsaved changes warnings.
   - Enforce optimistic concurrency control via `expectedRevisionNumber` to return `409 Conflict` when concurrent edits occur.

4. **Implement Signed Ephemeral Preview Tokens**:
   - Generate HMAC-SHA256 signed preview tokens with 15-minute expiration (`POST /api/v1/posts/:postId/preview-token`).
   - Serve preview content via `GET /api/v1/posts/:postId/preview?token=...` with mandatory `X-Robots-Tag: noindex, nofollow` headers.
   - Provide multi-site layout simulation in admin preview modals (Travel Blog vs Air Sports viewports).

## Consequences

- **Positive**:
  - Zero coupling between admin editing tools and public site themes.
  - Robust security defenses against file spoofing, XSS, and directory traversal.
  - Writers never lose work on connection drop or tab closure.
  - Unpublished drafts cannot be indexed by search crawlers or enumerated by unauthenticated visitors.
- **Negative / Costs**:
  - Rich text extensions require schema synchronization between ProseMirror AST and backend JSONB schema validator.
  - Local storage provider stores files on local disk; production clustering will require an S3/R2 cloud storage provider implementation.
