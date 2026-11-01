# ADR-0014: Locale negotiation with a typed message catalog

- Status: Accepted
- Date: 2026-11-01
- Owners: backend engineering

## Context

The platform's operators may read Bangla or English. Phase 03 needs an error
localization strategy that later phases can extend, without a dependency that
dominates the architecture or a database table pretending to be a translation
catalog.

Requirements: stable machine codes, translation separate from business logic, a
deterministic fallback, a validated language preference, and no translated codes.

## Decision

- **Transport**: `Accept-Language`, parsed by `resolveLocale`. q-values are honoured;
  malformed entries, unsupported languages, and wildcards resolve to `en`.
- **Storage**: a TypeScript catalog (`common/i18n/messages.ts`). `en` defines the
  `MessageKey` union, and `bn` is typed `Record<MessageKey, string>`, so a missing
  translation is a compile error rather than a runtime fallback.
- **Resolution point**: the exception filter. Exceptions carry a `messageKey`; the
  filter resolves it with the request locale. Services and controllers never handle
  translations.
- **Codes**: `ApiErrorCode` and validation constraint names are never translated.
- **Scope**: Phase 03 ships general HTTP messages and the validation constraints in
  use. Domain messages are added with their domain.

## Alternatives considered

| Option                                         | Why not                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `nestjs-i18n`                                  | Capable, but a dependency and its own config/loader surface for one catalog                                  |
| Storing messages in PostgreSQL                 | Turns a build artifact into mutable data; a missing row becomes a runtime bug                                |
| `Accept-Language` ignored, user profile locale | Requires authentication, which does not exist yet; error localization must work for unauthenticated requests |
| Per-controller message maps                    | Duplicates strings and guarantees drift                                                                      |
| Translating error codes                        | Breaks clients, logs, and support scripts                                                                    |

## Consequences

Positive: no new dependency, deterministic fallback, complete-locale guarantee at
compile time, one place to add a language, and localization that works before
authentication exists.

Negative: translators edit TypeScript; adding a locale requires a code change and a
redeploy. The catalog is not hot-swappable.

Accepted cost: a deploy to fix a translation, in exchange for type safety and no
runtime lookup failure.

## Future migration considerations

If translation volume or external translators become a real need, move catalogs to
JSON files loaded at build time (keeping the same keys and typings) or to a service
with a compile-time check in CI. The request-level negotiation, exception-carried
keys, and untranslated codes stay unchanged. A user-profile locale can be added as a
higher-precedence source once authentication exists, with `Accept-Language` as the
fallback.
