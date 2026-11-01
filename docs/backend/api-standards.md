# API standards

Status: implemented by Phase 03. These rules apply to every endpoint added later.

## Versioning and prefix

- One global prefix from `API_PREFIX` (default `api/v1`), applied in `bootstrap.ts`.
- Controllers declare resource paths only (`@Controller('health')`), never the
  prefix or the version.
- Additive changes are non-breaking. Removing or renaming a field, or changing its
  meaning, requires a new version path with an overlap period.
- The OpenAPI document includes the prefix in its paths and adds no duplicate
  server prefix.

## Success responses

Every successful response is wrapped exactly once:

```json
{
  "data": { "status": "ok", "service": "api", "uptimeSeconds": 128 },
  "meta": { "requestId": "3f1b8f5e-…", "timestamp": "2026-11-01T10:00:00.000Z" }
}
```

Rules:

- Resources are returned directly inside `data`. There is no second wrapper.
- `meta` carries the correlation id and timestamp so callers never repeat them.
- `204 No Content` returns no body.
- The envelope is applied by one interceptor; handlers return domain data.

Why not bare resource bodies? See [ADR-0013](../adr/0013-api-envelope-and-error-contract.md):
the envelope is one level, the admin client already consumes it, and it gives every
response a correlation id without per-endpoint conventions.

### Pagination (reserved)

Paginated collections will use `data.items` plus `data.pageInfo`, not a second
envelope:

```json
{ "data": { "items": [], "pageInfo": { "nextCursor": null } }, "meta": {} }
```

Cursor pagination is the default for feeds; offset is allowed only where a stable
sort makes it correct. `limit` is always capped server-side.

## Error responses

One shape for every failure, including validation, framework 404s, throttling, and
infrastructure errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": [{ "field": "email", "code": "isEmail", "message": "Enter a valid email address." }]
  },
  "meta": { "requestId": "3f1b8f5e-…", "timestamp": "2026-11-01T10:00:00.000Z" }
}
```

- `code` is stable, machine-readable, and **never localized**.
- `message` is human-readable and localized.
- `details[].code` is the validation constraint (`isEmail`, `whitelistValidation`,
  …). Clients branch on `field` and `code`, never on `message`.
- `details` is present only when there is something to list.
- No stack trace, SQL fragment, driver message, connection string, or internal
  exception text ever reaches a client.

### Error codes

| HTTP | Code                   | Meaning                                    |
| ---- | ---------------------- | ------------------------------------------ |
| 400  | `VALIDATION_ERROR`     | Invalid fields or unparseable input        |
| 401  | `UNAUTHENTICATED`      | Sign-in required (Phase 04)                |
| 403  | `FORBIDDEN`            | Authenticated but not permitted (Phase 04) |
| 404  | `NOT_FOUND`            | Unknown route or resource                  |
| 409  | `CONFLICT`             | State conflict                             |
| 413  | `PAYLOAD_TOO_LARGE`    | Body exceeds `BODY_LIMIT`                  |
| 422  | `UNPROCESSABLE_ENTITY` | Syntactically valid, semantically rejected |
| 429  | `RATE_LIMITED`         | Throttle exceeded                          |
| 503  | `SERVICE_UNAVAILABLE`  | Mandatory dependency down (readiness)      |
| 500  | `INTERNAL_ERROR`       | Unexpected failure, message always generic |
| —    | `HTTP_ERROR`           | Unmapped status, defensive fallback        |

Adding a code is a contract change: update `packages/types`, the status mapping in
`common/http/error-code.ts`, the message catalogs, and the tests.

## Validation

- `ValidationPipe` is global with `whitelist`, `forbidNonWhitelisted`, `transform`,
  and `enableImplicitConversion: false`.
- Unexpected fields are a 400 with `field` set to the offending property and code
  `whitelistValidation`. This is deliberate: silently dropping a field hides client
  bugs, and a privileged field would otherwise disappear without a trace.
- Implicit conversion is off so `"abc"` cannot become `NaN` quietly. DTOs opt in per
  property with `@Type`.
- Path and query parameters use DTOs too (`@Param()`/`@Query()` with a class).
- DTOs are the only input type a service receives; raw request objects never reach
  persistence.
- Response shaping is separate from request validation.

### Defining a DTO

```ts
export class CreateThingDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  link?: string;
}
```

Constraints with a catalog entry map to a localized message; anything else degrades
to a generic "invalid field" rather than leaking English.

## Localization

Supported locales: `en` (default) and `bn`. See ADR-0014 and
[the message catalogs](../../apps/api/src/common/i18n/messages.ts).

- The client sends `Accept-Language`; q-values are honoured, malformed entries are
  ignored, and anything unsupported resolves to `en`.
- The negotiated locale is attached to the request by middleware and used by the
  exception filter. Services never handle translations.
- Machine codes are never translated. Only `message` and `details[].message` are.
- Translation lookup lives in one catalog. Adding a key to `en` makes the `bn`
  translation a type error until it is added, so a language can never ship with a
  silent gap.
- Success payloads are data, not prose: user-facing copy belongs to the frontend
  translation layer. Domain errors added later use `ApiException` with a catalog key.

## Correlation

- `X-Request-Id` is accepted only when it matches `^[A-Za-z0-9._:-]{8,128}$`.
- Otherwise a UUID is generated; either way it is echoed in the header and in
  `meta.requestId`, and used in logs.
- The value is never trusted as an authorization input, only as a correlation key.

## OpenAPI

- Document: `/api/v1/docs` (UI) and `/api/v1/docs-json` (JSON).
- Enabled outside production. In production it requires `DOCS_ENABLED=true`; there
  is no half-built access control — the routes are simply not registered.
- The document contains only implemented endpoints. Adding a tag for a planned
  module would publish a contract that does not exist.
- Error and envelope schemas come from `common/http/openapi-error.dto.ts`; response
  DTOs live with their feature module.
- A test asserts that documented paths match the implemented surface exactly.

## Security headers on responses

Helmet applies defaults; `x-powered-by` is disabled; `Cache-Control: no-store` is
set explicitly on operational endpoints. CORS uses an explicit allowlist with
credentials enabled and an `Accept-Language` allowed header.
