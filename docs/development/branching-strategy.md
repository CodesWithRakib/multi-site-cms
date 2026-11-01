# Branching and release strategy

## Model

Phase 01 and later use short-lived branches off `main` with a protected `main`.

```text
main ──●──●────────●────●──●
        \            \     /
         ●─● (feat)  ● (fix)
```

- `main` is always deployable and always passes `pnpm lint`, `pnpm typecheck`,
  `pnpm test`, and `pnpm build`.
- Branches are short-lived (hours to a few days) and named by intent:
  - `feat/<short-slug>` — new capability inside the approved phase scope
  - `fix/<short-slug>` — defect repair
  - `docs/<short-slug>` — documentation only
  - `chore/<short-slug>` — tooling, dependencies, CI
  - `adr/<short-slug>` — decision record plus its consequences
- There is no `develop` branch. The project has a single deployment line per
  environment; long-lived integration branches would add merge risk with no gain.

## Commits

- Imperative subject under ~72 characters naming the intent.
- Body explains why and notes verification when it is not obvious.
- One logical change per commit. Formatting-only churn stays separate from
  behavior.
- Never commit secrets, `.env` files, build output, or `node_modules`.

## Merge requirements

1. CI verification passes (lint, typecheck, unit/contract tests, build, E2E
   discovery).
2. Review approval from a maintainer for anything cross-cutting.
3. A new or updated ADR when the change is foundational.
4. Documentation updated in the same change.
5. No `--force` pushes to `main`; history rewrites stay on the feature branch.

Prefer squash-merge for feature branches to keep `main` readable, with the pull
request describing the change. Keep the original commits only when the sequence
carries information a reviewer needs.

## Versioning

Phase 01 keeps `0.1.0` across the workspace. Private packages are not published;
internal version numbers exist only for clarity.

- Bump the root version for a phase milestone.
- A breaking API contract change requires a new API version path (`/api/v2`), not
  only a version bump. See [API conventions](../architecture/api-conventions.md).
- Shared packages must not be consumed by version range; they use `workspace:*`.

## Environment mapping

| Branch                         | Environment                             |
| ------------------------------ | --------------------------------------- |
| Feature branch                 | Preview deploy (hosting-provided)       |
| `main`                         | Staging, then production on release tag |
| Tag `v<major>.<minor>.<patch>` | Production release                      |

Preview deployments must use non-production secrets and a database that is safe to
destroy. A preview must never point at production data.

## Hotfixes

Branch from `main`, fix, add a regression test, merge after the same checks.
If staging has unshipped work, a hotfix may deploy directly from `main` once the
regression test passes. Record the incident and the added control in the threat
model when the defect was security-relevant.

## Release checklist

- [ ] `main` is green in CI.
- [ ] Migrations reviewed and ordered; no `synchronize`.
- [ ] Environment variables present in the target environment.
- [ ] Rollback target identified (previous deploy and migration state).
- [ ] Smoke test the four applications after deploy.
- [ ] Tag the release and note the change set.
