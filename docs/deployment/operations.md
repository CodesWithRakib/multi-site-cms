# Operations runbook

Phase 01 has no production deployment. This runbook defines the procedures that
exist now (local and CI) and the ones Phase 02 must have before real content.

## Local operations

| Task                  | Command                                                   |
| --------------------- | --------------------------------------------------------- |
| Full stack            | `pnpm dev`                                                |
| One application       | `pnpm --filter @multi-site-cms/<app> dev`                 |
| Database start/stop   | `pnpm db:up` / `pnpm db:down`                             |
| Database recreate     | `pnpm db:reset`                                           |
| Database logs         | `pnpm db:logs`                                            |
| Migrations (Phase 02) | `pnpm --filter @multi-site-cms/api db:migration:run`      |
| Migration status      | `pnpm --filter @multi-site-cms/api db:migration:show`     |
| Environment diagnosis | `pnpm run doctor` (bare `pnpm doctor` is pnpm's built-in) |

Migrations run against `dist/`, so build the API first when running them from the
CLI.

## Health and signals

- `GET /api/v1/health` is **liveness**: the process can serve HTTP. It does not
  prove database connectivity or downstream health.
- The admin application renders an API status widget (`Connected to api` /
  `API online`) — a manual check, not monitoring.
- Responses carry `X-Request-Id`; use it to correlate a report with logs.
- 429 responses mean the per-IP throttle (120/min) was exceeded.

## Deploy procedure (when hosting exists)

1. Confirm CI is green on the commit being deployed.
2. Apply migrations as a separate step, once, not from application startup.
3. Deploy the API, then the web applications.
4. Verify `GET /api/v1/health` returns 200 with the envelope.
5. Load each web application and confirm its branding and metadata.
6. Check that the admin can reach the API from its deployed origin (CORS).
7. Record the deployed commit and the previous known-good version.

Rollback: redeploy the previous known-good version. If a migration already ran,
prefer a forward fix; destructive rollbacks require an explicit decision and a
backup.

## Incident checklist

- [ ] Identify scope: one site, the admin, the API, or the database.
- [ ] Capture the request id and timestamp of the first failure.
- [ ] Check whether configuration changed (env var, CORS, database URL).
- [ ] Check the database connection ceiling and slow queries.
- [ ] Confirm whether the failure is a deploy, a dependency, or traffic.
- [ ] Mitigate: roll back, raise a limit deliberately, or disable a failing feature.
- [ ] Record cause and the control that prevents recurrence (threat model, ADR,
      checklist, or test).

## Backup and restore (Phase 02 requirement)

A backup is not a backup until a restore is tested.

1. Enable the provider's automated backups and confirm the retention window.
2. Perform a restore into a scratch database.
3. Verify row counts for key tables and one end-to-end read of published content.
4. Record the drill date, duration, and any gaps in this document.

Free tiers frequently omit automated backups or shorten retention. If the chosen
provider cannot meet the requirement, schedule logical dumps to external storage
and test those instead.

## Monitoring minimum (Phase 02)

At minimum: uptime check on the API health endpoint, error rate visibility,
database connection usage, and a storage/quota warning before the free-tier
ceiling. Alerts go to a channel someone actually reads.

## Cost and quota watch

Track the limits documented in [free-tier deployment](free-tier-deployment.md).
When a limit is approached, decide between optimizing and upgrading — with an ADR
for the upgrade — rather than discovering the ceiling in production.

## Known Phase 01 limitations

- No production environment, monitoring, or alerting exists.
- No authentication means no privileged endpoint is exposed; keep it that way.
- Rate limiting is per instance, not global.
- No CSP or HSTS yet; both belong to the platform decision.
