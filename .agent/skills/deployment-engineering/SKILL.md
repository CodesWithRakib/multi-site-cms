# Skill: deployment-engineering

## Purpose

Make environments reproducible, deploys boring, and failures survivable on a
free-first budget without assuming free tiers are production guarantees.

## When to use

Changing CI, build output, environment variables, hosting assumptions, database
operation, observability, or the local Docker topology.

## Mandatory rules

1. **Environment parity by configuration.** Same code, same commands, different
   environment variables. No `if (production)` branches to work around
   configuration.
2. **Configuration is validated at startup.** A missing or malformed variable
   fails fast with a clear message; never fall back silently to a development
   default in production.
3. **Secrets come from the platform.** Hosting secret stores only; never baked
   into images, build args, or client bundles. Rotate by redeploy.
4. **Builds are reproducible.** Lockfile committed, frozen installs in CI, pinned
   Node and pnpm versions via `.nvmrc`, `packageManager`, and `engines`.
5. **CI is the gate.** Lint, typecheck, unit tests, build, and E2E listing run on
   every change; a red gate blocks merge.
6. **Migrations run as a deploy step.** Never automatically on application
   start, never concurrently from multiple instances.
7. **Free-tier limits are documented and monitored.** Record quotas, cold starts,
   connection caps, and upgrade paths; assert the assumptions still hold before
   relying on them.
8. **Backups are verified, not assumed.** A documented restore drill exists
   before any production data is stored.
9. **Rollback is a plan.** Know the previous deploy, the migration state, and the
   rollback command before shipping.

## Workflow

1. Identify the environment and the deployment unit.
2. List every required variable and where it is set (local `.env`, CI, host).
3. Confirm build command, output directory, port binding, and health path.
4. Check the database story: connection string, pooling, migration step, backup.
5. Verify the change locally with the same commands CI runs.
6. Update `docs/deployment/environments.md` and the free-tier notes if a limit
   or platform assumption changed.

## Anti-Patterns

- Deploying on `latest` images or unpinned versions.
- Running `synchronize` or migrations on every instance boot.
- A health check that reports healthy before dependencies are reachable when it
  is used for readiness.
- Assuming a free tier provides backups, IPv4, or zero cold starts.
- Hardcoding `localhost` URLs in production config.
- Deploying without a known-good previous version to return to.

## Review checklist

- [ ] Config validated at startup; no silent production defaults.
- [ ] Secrets from the host secret store; nothing in git or the bundle.
- [ ] Frozen install and pinned runtime in CI.
- [ ] Build, start, and health commands verified locally.
- [ ] Migration step ordered correctly and idempotent to run once.
- [ ] Free-tier limits and upgrade path documented.
- [ ] Rollback path stated.

## Project references

- `docs/deployment/environments.md`
- `docs/deployment/free-tier-deployment.md`
- `docs/deployment/operations.md`
- `.github/workflows/ci.yml`
- `infrastructure/docker/docker-compose.yml`
