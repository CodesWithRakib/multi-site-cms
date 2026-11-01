# ADR-0001: pnpm workspace and Turborepo monorepo

- Status: Accepted
- Date: 2026-11-01
- Owners: platform engineering

## Context

Two public publications, one admin application, and one API must share contract
types, validation, configuration, and UI primitives. They will be developed
together, versioned together, and changed by the same small team (including AI
agents). A multi-repository setup would require publishing internal packages or
vendoring them, and every contract change would become a cross-repository
coordination problem.

The alternatives were weighed against three constraints: strict dependency
pinning, a single lockfile, and fast incremental verification without a paid CI
tier.

## Decision

Use one repository with pnpm workspaces and Turborepo.

- `pnpm-workspace.yaml` globs `apps/*`, `apps/sites/*`, and `packages/*`.
- Versions are exact; one `pnpm-lock.yaml` is authoritative; CI installs with
  `--frozen-lockfile`.
- Turborepo defines `build`, `dev`, `lint`, `typecheck`, `test` with
  `^build`/`^typecheck` dependencies so packages verify before consumers.
- Workspace packages are source-only and type-checked in place; Next.js
  applications list them in `transpilePackages`.
- pnpm lifecycle scripts are blocked by default; the allowlist is explicit.

## Alternatives considered

| Option                | Why not                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| Separate repositories | Cross-cutting contract changes become multi-repo releases; no atomic change |
| npm workspaces        | Weaker strictness on phantom dependencies; slower installs                  |
| Yarn PnP              | Ecosystem tooling friction with Next.js and NestJS build outputs            |
| Nx                    | Powerful, but a heavier generator/graph model than this project needs       |
| No build orchestrator | Root scripts would rebuild or check everything on each change               |

## Consequences

Positive: one install, one lockfile, atomic changes across app and contract,
cached task results, a single place for shared tooling configuration.

Negative: a single repository grows; CI must not become "run everything" as the
project scales; `turbo` caching must be understood to avoid stale-confidence
results. Accepted cost: contributors must use pnpm, not npm or yarn.

## Future migration considerations

If build times dominate, add remote caching before splitting the repository. If
independent deploy cadences or separate ownership become real, the `apps/*`
boundaries already make extraction mechanical: the application's dependencies are
its `package.json` plus workspace packages, which could be published privately.
