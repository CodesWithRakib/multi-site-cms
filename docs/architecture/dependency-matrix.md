# Dependency matrix

Every version below is the version pinned in the workspace `package.json` files.
Exact transitive resolution lives in `pnpm-lock.yaml`; this table exists so a
future change can be evaluated against a known-compatible set.

## Runtime

| Dependency               | Version | Used by                          | Notes                                     |
| ------------------------ | ------- | -------------------------------- | ----------------------------------------- |
| Node.js                  | 24.11+  | all                              | `.nvmrc`, `engines`, CI matrix            |
| pnpm                     | 12.4.2  | workspace                        | `packageManager`, `engines`               |
| Next.js                  | 16.4.3  | admin, both sites                | App Router                                |
| React / React DOM        | 19.3.1  | admin, both sites, `ui`, `redux` | Server Components                         |
| NestJS                   | 12.3.2  | api                              | `common`, `core`, `platform-express`      |
| @nestjs/throttler        | 6.7.1   | api                              | 120 req/min/IP global guard               |
| TypeORM                  | 1.1.2   | api                              | CLI migrations only; `synchronize: false` |
| pg                       | 8.23.1  | api                              | PostgreSQL driver                         |
| helmet                   | 8.3.0   | api                              | Baseline response headers                 |
| class-validator          | 0.15.1  | api                              | DTO validation                            |
| class-transformer        | 0.5.1   | api                              | DTO transformation                        |
| reflect-metadata         | 0.2.2   | api                              | Decorator metadata                        |
| rxjs                     | 7.8.2   | api                              | Nest observables                          |
| Zod                      | 4.6.7   | api, `validation`, `config`      | Environment and shared schemas            |
| Redux Toolkit            | 2.13.0  | `redux`, admin                   | RTK + RTK Query                           |
| react-redux              | 9.3.1   | `redux`, admin                   | Provider and hooks                        |
| Tailwind CSS             | 4.3.3   | admin, both sites                | PostCSS plugin `@tailwindcss/postcss`     |
| class-variance-authority | 0.7.1   | `ui`                             | Component variants                        |
| tailwind-merge           | 3.7.0   | `ui`                             | Class merging                             |
| clsx                     | 2.1.1   | `ui`                             | Conditional classes                       |
| @radix-ui/react-slot     | 1.5.0   | `ui`                             | Polymorphic `asChild` primitive           |
| PostgreSQL               | 18.6    | infrastructure                   | `postgres:18.6-alpine`                    |

## Tooling

| Tool                   | Version | Notes                                                      |
| ---------------------- | ------- | ---------------------------------------------------------- |
| TypeScript             | 6.0.3   | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Turborepo              | 2.11.10 | Task graph and local cache                                 |
| ESLint                 | 9.39.5  | Flat config, `typescript-eslint` 8.72.1                    |
| typescript-eslint      | 8.72.1  | Recommended set, no type-aware rules in Phase 01           |
| eslint-config-next     | 16.4.3  | Next.js applications                                       |
| Prettier               | 3.9.10  | 100 columns, single quotes, LF                             |
| Vitest                 | 5.0.5   | Workspace packages                                         |
| @vitejs/plugin-react   | 6.1.2   | Vitest React transform                                     |
| jsdom                  | 30.1.3  | Component tests                                            |
| @testing-library/react | 16.3.3  | Component behavior                                         |
| Jest                   | 30.5.2  | API tests only                                             |
| ts-jest                | 29.4.15 | API TypeScript transform                                   |
| supertest              | 7.3.1   | API HTTP assertions                                        |
| Playwright             | 1.64.1  | Cross-application smoke tests                              |

## Compatibility constraints

1. **Two test runners by design.** Vitest serves packages and components; Jest
   serves the Nest API. Do not introduce a third or migrate one to the other
   without an ADR.
2. **Next.js and React are locked together.** Upgrade them in the same change and
   run all four applications' builds.
3. **NestJS packages move as one version line.** `common`, `core`,
   `platform-express`, `testing`, and `@nestjs/cli` stay on 12.x.
4. **TypeORM's runtime API is only used by the CLI.** Importing it into the Nest
   runtime requires the Phase 02 database module and a reviewed decision.
5. **Zod 4 semantics.** `z.url()` accepts non-HTTP schemes, so every URL schema
   refines the protocol; copy `httpUrlSchema` rather than duplicating the rule.
6. **Tailwind 4 has no `tailwind.config.js` requirement.** Tokens live in
   `packages/ui/src/styles.css`; do not reintroduce the v3 config pattern.
7. **pnpm blocks lifecycle scripts.** A new dependency with a build step must be
   added to `allowBuilds` in `pnpm-workspace.yaml` with a justification.
8. **No canary, beta, or RC versions.** If a needed fix exists only in a
   prerelease, document the risk and get approval.

## Adding a dependency

1. Confirm the need is not already met by an existing package.
2. Check the current stable release and its peer ranges against this matrix.
3. Check maintenance status and known advisories.
4. Add it to the narrowest workspace that needs it, at an exact version.
5. Update this table and the change's description with the reason.

## Deferred dependencies

Deliberately absent in Phase 01: React Hook Form, Tiptap, Socket.IO/SSE, an
object-storage SDK, caching/queue infrastructure, and any auth library. Each
arrives with the feature that needs it and gets recorded here at that time.
