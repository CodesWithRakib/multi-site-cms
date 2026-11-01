# Monorepo structure and ownership

## Layout

```text
multi-site-cms/
├── apps/
│   ├── admin/                 @multi-site-cms/admin        :5000
│   ├── api/                   @multi-site-cms/api          :4000
│   └── sites/
│       ├── travel-blog/       @multi-site-cms/travel-blog  :5001
│       └── air-sports/        @multi-site-cms/air-sports   :5002
├── packages/
│   ├── types/                 contracts, no runtime deps
│   ├── validation/            Zod schemas
│   ├── config/                constants, public config, headers
│   ├── api-client/            JSON transport
│   ├── redux/                 store factory, RTK Query, hooks
│   ├── ui/                    primitives and token contract
│   ├── tsconfig/              shared compiler configuration
│   └── eslint-config/         shared lint configuration
├── infrastructure/docker/     PostgreSQL 18 Compose service
├── e2e/                       Playwright smoke tests
├── scripts/                   repository tooling (doctor)
├── docs/                      design, security, deployment, ADRs
└── .agent/skills/             project-local agent skills
```

## Workspace mechanics

- `pnpm-workspace.yaml` globs `apps/*`, `apps/sites/*`, `packages/*`.
- `turbo.json` defines `build`, `dev`, `lint`, `typecheck`, and `test`. `build` and
  `typecheck` depend on `^build`/`^typecheck`, so packages are validated before
  consumers.
- Workspace packages are **source-only**: `exports` point at `src/index.ts` and
  Next.js lists them in `transpilePackages`. There is no build step to forget.
- The API imports only the type-only `types` package, which keeps the Nest build
  free of framework-agnostic JSX/tooling concerns.
- Dependencies are pinned to exact versions. The lockfile is authoritative.

## Ownership rules

| Concern                      | Owner                                       |
| ---------------------------- | ------------------------------------------- |
| HTTP contract types          | `packages/types`                            |
| Request/response schemas     | API DTOs; shared primitives in `validation` |
| Browser-safe constants       | `packages/config`                           |
| HTTP transport               | `packages/api-client`                       |
| Client/server cache          | `packages/redux` (admin only)               |
| Visual primitives and tokens | `packages/ui`                               |
| Site branding and routing    | the site application                        |
| Persistence and migrations   | `apps/api/src/database`                     |

## Adding a new website

This is the expansion path the architecture must keep cheap. For a new
publication:

1. Create `apps/sites/<key>` from an existing site (branding, tokens, metadata).
2. Set a stable `siteConfig.key`; it maps to the `sites.key` row in Phase 02.
3. Add the application to `pnpm-workspace.yaml` coverage automatically (glob), to
   `turbo.json` only if it needs a new task, to the Playwright `webServer` list,
   and to `CORS_ORIGINS` defaults.
4. Register the site row, domains, and settings through the admin API once Phase
   02 exists.
5. Do not modify the API's authorization logic, the content model, or shared
   packages. If a new site needs one of those changes, the platform abstraction is
   wrong and must be fixed centrally.

## Adding a package

Required: at least two real consumers or a stated cross-cutting invariant, a
single responsibility, an `exports` map, `lint`/`typecheck`/`test` scripts, and a
row in this document. Order of preference: extend an existing package, then add a
new one.

## Anti-patterns

- A `shared` package that depends on everything.
- Site-specific components inside `packages/ui`.
- Deep imports such as `@multi-site-cms/ui/src/components/button`.
- Generating a per-site API or database package.
- Adding a root-level catch-all workspace for scripts that no app uses.

## References

- [Overview](overview.md)
- [Dependency matrix](dependency-matrix.md)
- [Governance](governance.md)
- [ADR 0001](../adr/0001-monorepo-pnpm-turborepo.md)
