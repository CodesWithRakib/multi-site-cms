# Coding standards

These standards are enforced by tooling where possible and by review everywhere
else. `packages/tsconfig/base.json` and `packages/eslint-config/base.mjs` are the
source of truth for the mechanical parts.

## TypeScript

- `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`, `allowUnreachableCode: false`.
- No `any`, no `@ts-ignore`, no `@ts-expect-error` without an adjacent explanation.
- Avoid `as`; prefer a type guard (`isRecord`, `instanceof`) or a schema parse.
- Model invalid states out of existence: discriminated unions over boolean flags.
- `import type` for type-only imports (enforced by
  `@typescript-eslint/consistent-type-imports`).
- Export types from the package entry point; keep implementation files internal.

## Imports and boundaries

- Import through package entry points: `@multi-site-cms/ui`, never
  `@multi-site-cms/ui/src/...` (ESLint blocks the pattern).
- Applications may import packages; packages never import applications.
- `types` has no runtime dependencies. `api-client` is framework-free. `redux`
  does not import Next.js. `ui` does not import API or server code.
- Use the `@/` alias inside an application for its own source.

## Naming

| Thing            | Convention                         | Example                    |
| ---------------- | ---------------------------------- | -------------------------- |
| Files (modules)  | kebab-case                         | `request-id.middleware.ts` |
| React components | PascalCase file, PascalCase export | `platform-status.tsx`      |
| Functions        | camelCase, verb-first              | `createPublicWebConfig`    |
| Booleans         | `is`/`has`/`can` prefix            | `isPublished`              |
| Constants        | SCREAMING_SNAKE for primitives     | `API_PREFIX`               |
| Types/interfaces | PascalCase, no `I` prefix          | `ApiErrorResponse`         |
| DB columns       | snake_case                         | `published_at`             |
| Routes           | kebab-case, plural resource        | `/sites/:siteId/posts`     |

## Functions and modules

- One responsibility per module; one reason to change per function.
- Controllers route, services decide, repositories persist.
- Prefer pure functions for rules; keep I/O at the edges.
- Keep files under roughly 200 lines; split by responsibility, not by count.
- Comments explain why, not what. Delete commented-out code.

## Errors

- Throw typed, meaningful errors; never swallow.
- API: throw `HttpException` subclasses; the global filter shapes the response.
- Client: normalize transport failures into `ApiClientError`; never surface a raw
  `TypeError: Failed to fetch` to a user.
- Log at the boundary that can act on the failure, with the request id.

## React and Next.js

- Server Components by default; `'use client'` only for interaction or browser
  state, at the smallest leaf.
- No business logic in page components.
- Accessible markup: semantic elements, labeled controls, visible focus, one `h1`.
- Do not hardcode colors or spacing; use the token contract in
  `packages/ui/src/styles.css`.

## Database

- Migrations only. `synchronize: false` everywhere.
- Constraints at the database level, not only in services.
- Tenant-scoped queries include `site_id`.

## Formatting

Prettier owns whitespace: 100 columns, single quotes, trailing commas, LF,
2-space indent. ESLint owns correctness. Run `pnpm format` before committing;
CI runs `pnpm format:check`.

Do not disable a rule to pass. If a rule is wrong for the codebase, change it in
`packages/eslint-config` with a reason and update this document.

## Commits and pull requests

- Commit messages state intent: "Reject unknown DTO fields before validation",
  not "update files".
- One logical change per commit; do not mix formatting-only churn with behavior.
- A pull request states what changed, why, how it was verified, and what remains.
- Never commit `.env` files, build output, or `node_modules`.

## Documentation

A change that alters a command, boundary, dependency, or security control updates
the relevant document in the same change. See the `documentation` skill.
