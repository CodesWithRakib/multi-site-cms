# ADR-0013: Single response envelope with structured, localized field errors

- Status: Accepted
- Date: 2026-11-01
- Owners: backend + frontend engineering

## Context

Phase 01 established a success envelope `{ data, meta }` and an error envelope
`{ error, meta }`, and the admin client was built against both. Phase 03 had to
formalize the contract before more endpoints exist, including validation errors and
message localization.

The risk in both directions is real: an envelope on every response can be gratuitous
nesting, while bare resource bodies force every endpoint to invent its own error and
correlation conventions.

## Decision

**Keep exactly one envelope level.** Success is `{ data, meta }`; failure is
`{ error, meta }`.

- Resources are returned directly inside `data`; nothing is wrapped twice.
- Paginated collections will be `data.items` + `data.pageInfo`, not a second layer.
- `meta` carries `requestId` and `timestamp` for every response.
- Error `details` is an array of `{ field?, code, message }`. `code` is the stable
  validation constraint name; `field` is the dotted path.
- Error codes come from the shared `ApiErrorCode` union and are **never localized**.
  Only `message` and `details[].message` follow the request locale.
- 5xx responses always use one generic message, whatever the internal exception said.

## Alternatives considered

| Option                                    | Why not                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Bare resource bodies                      | Every client re-implements correlation; error shape drifts per endpoint |
| Nested envelope (`{ data: { data: … } }`) | Pure overhead; the current client already parses one level              |
| JSON:API                                  | Heavy for this product; relationships are not exposed over HTTP yet     |
| Error `details` as `string[]`             | Field association is lost; localization cannot preserve codes           |
| Localizing codes                          | Breaks client branching and log correlation; codes are the contract     |

## Consequences

Positive: one parser on the client, correlation on every response, field errors that
a form can attach to an input, and stable codes that survive translation.

Negative: one extra object allocation per response and a small amount of client
unwrapping. The `details` shape is a breaking change from the Phase 02
`string[]` — acceptable because no client consumed it yet.

## Future migration considerations

If streaming or partial-content endpoints are added, they opt out of the envelope
explicitly and are documented as such. A future bulk or file endpoint may need a
different contract; that is a new ADR, not a change to this one.
