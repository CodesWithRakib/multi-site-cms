# API conventions

The API is a NestJS modular monolith served under `/api/v1`. These conventions
are implemented in `apps/api/src/common` and shared through
`@multi-site-cms/types`.

## Response envelope

Success:

```json
{
  "data": { "status": "ok", "service": "api", "uptimeSeconds": 128 },
  "meta": { "requestId": "…", "timestamp": "2026-11-01T10:00:00.000Z" }
}
```

Failure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": ["email must be an email"]
  },
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

Rules:

- The envelope is applied globally by `ResponseEnvelopeInterceptor`; controllers
  return domain data only.
- `details` is optional and holds structured field errors:
  `{ field?, code, message }`. `code` is the stable validation constraint (for
  example `isEmail`), never a sentence.
- `204 No Content` responses carry no envelope.
- Never add ad-hoc top-level keys; consumers and the client parser assume two
  keys.

## Error codes

`error.code` is a stable machine value from `ApiErrorCode`, mapped from the HTTP
status so clients can branch without parsing prose:

| HTTP  | Code                   |
| ----- | ---------------------- |
| 400   | `VALIDATION_ERROR`     |
| 401   | `UNAUTHENTICATED`      |
| 403   | `FORBIDDEN`            |
| 404   | `NOT_FOUND`            |
| 409   | `CONFLICT`             |
| 413   | `PAYLOAD_TOO_LARGE`    |
| 422   | `UNPROCESSABLE_ENTITY` |
| 429   | `RATE_LIMITED`         |
| 503   | `SERVICE_UNAVAILABLE`  |
| 500   | `INTERNAL_ERROR`       |
| other | `HTTP_ERROR`           |

Adding a code is a contract change: update `packages/types`, the mapping in
`apps/api/src/common/http/error-code.ts`, and any client branch.

## Request correlation

- `X-Request-Id` is accepted only when it matches `^[A-Za-z0-9._:-]{8,128}$`.
- Otherwise the API generates a UUID.
- The value is returned in the `X-Request-Id` response header, `meta.requestId`,
  and is the identifier used in logs and audit events.
- `X-Request-Id` is listed in CORS `exposedHeaders` so browsers can read it.

## Localization

- `Accept-Language` is negotiated per request: `en` (default) and `bn`; q-values
  are honoured, malformed entries ignored, unsupported languages fall back to `en`.
- `error.code` and `details[].code` are **never** translated; `message` and
  `details[].message` are.
- Messages live in one typed catalog; a locale missing a key fails type checking.
- Services throw `ApiException` with a message key; translation happens only in the
  exception filter. Success payloads are data, not prose.

## Validation

- Every body, query, and route parameter has a DTO.
- `ValidationPipe` runs with `whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true`. Unknown fields are a 400, not silently dropped.
- Constraints are declarative (`class-validator`); cross-field rules go in a
  custom validator, not in the controller.
- Shared browser/API shapes are defined in Zod in `packages/validation`; the two
  definitions must not diverge, so keep DTOs thin over shared primitives.

## Versioning

- One prefix, `/api/v1`, set in `bootstrap.ts`.
- Additive changes (new optional field, new endpoint) are non-breaking.
- Removing a field, renaming, or changing semantics requires `/api/v2` with an
  overlap period and a deprecation note. Never mutate v1 semantics.

## Pagination, filtering, sorting

Reserved convention for Phase 02 list endpoints:

| Concern    | Convention                                                         |
| ---------- | ------------------------------------------------------------------ |
| Pagination | Cursor (`?cursor=…&limit=…`) for feeds; `limit` capped server-side |
| Sorting    | `?sort=published_at:desc` from an allowlist                        |
| Filtering  | Explicit query params, validated and allowlisted                   |
| Response   | `data: { items: [...], nextCursor: string \| null }`               |

Never accept a free-form `sort`/`filter` expression. Never return an unbounded
list.

## Caching semantics

- Authenticated or per-user responses: `Cache-Control: no-store`.
- Health and status endpoints: `no-store`.
- Public, published content (Phase 02): cacheable with an explicit
  `s-maxage` plus `stale-while-revalidate`, with invalidation on publish.
- ETag/conditional requests are reserved for public GETs.

## Site context

- Admin routes are site-scoped: `/sites/:siteId/posts`.
- `:siteId` is resolved against the caller's memberships by a guard.
- Public reads (Phase 02) resolve a site from an explicit public site key or a
  server-side hostname mapping; the API does not authorize from a caller-supplied
  `Host` header.
- Cross-site resources require an explicit shared record, never an implicit one.

## Authorization

Every endpoint documents and enforces a permission. Guards run before the
handler; scoped queries are still mandatory. Return `404` when existence would
leak another tenant's data. See [RBAC](rbac.md).

## Module layout

```text
apps/api/src/
  health/            infrastructure endpoints
  common/
    filters/         global exception filter
    interceptors/    response envelope
    middleware/      request id
    http/            status → error code mapping
  config/            environment parsing and validation
  database/          TypeORM CLI data source and migrations
```

Phase 02 adds one directory per domain module (`sites`, `auth`, `posts`,
`publications`, `media`, `audit`), each with its own controller, service, DTOs,
and entities. Modules talk through services or explicit events, never by
importing another module's internal repository.

## Local endpoints

| Method | Path                   | Notes                    |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/v1/health`       | Liveness only, enveloped |
| POST   | `POST /api/v1/unknown` | Enveloped `NOT_FOUND`    |

```text
GET /api/v1/health       liveness  — process serves HTTP, always 200 while alive
GET /api/v1/health/ready readiness — SELECT 1 with a 2s ceiling, 503 when down
GET /api/v1/docs         OpenAPI UI (not registered in production by default)
GET /api/v1/docs-json    OpenAPI document
```

Keep the split: a restart policy pointed at readiness turns a database blip into a
restart storm, and a traffic router pointed at liveness sends requests to instances
that cannot query. See ADR-0015.
