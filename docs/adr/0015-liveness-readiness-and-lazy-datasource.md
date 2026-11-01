# ADR-0015: Separate liveness and readiness, with a lazily opened pool

- Status: Accepted
- Date: 2026-11-01
- Owners: backend + operations

## Context

Phase 01 shipped a single `/health` endpoint that reported only that the process was
alive. Phase 03 wires a real database, so the deployment platform needs a truthful
answer to two different questions, and a bad answer to either produces operational
damage:

- Pointing a restart policy at a database check restarts healthy pods during a
  database blip.
- Pointing a traffic router at a liveness check sends requests to instances that
  cannot query.

## Decision

**Two endpoints, two questions.**

| Endpoint                   | Checks                          | Failure                   |
| -------------------------- | ------------------------------- | ------------------------- |
| `GET /api/v1/health`       | process can serve HTTP          | never fails while alive   |
| `GET /api/v1/health/ready` | database reachable (`SELECT 1`) | 503 `SERVICE_UNAVAILABLE` |

- The readiness check is one `SELECT 1` with a 2s ceiling. Not a table query, not a
  migration check, not statistics.
- The connection pool is opened **lazily**, on the first probe or first query, not at
  bootstrap. `DatabaseLifecycle` closes it on shutdown.
- A failed initialization is disposed so the next probe starts clean.
- Probe responses never include the DSN, host, or database name; failures are logged
  without the driver error object.

## Alternatives considered

| Option                                     | Why not                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| One combined health endpoint               | Cannot serve two different platform behaviours                            |
| Connect at bootstrap, fail fast on DB down | Crash-loops on a transient outage and makes local/CI runs need a database |
| Deep readiness (query real tables)         | Expensive, and fails before migrations run in a fresh environment         |
| No readiness check                         | Traffic reaches instances that cannot serve                               |
| Caching the readiness result               | Hides recovery and delays traffic restoration                             |

## Consequences

Positive: correct autoscaling and restart behaviour, cheap probes, local development
and CI that do not require PostgreSQL, and a first query that fails in one place
rather than at boot.

Negative: the first readiness probe pays the connection cost (bounded at 2s); a hot
path that forgets to handle an uninitialized pool will trigger the connection at
request time. Accepted: the pool is initialized once and reused.

## Future migration considerations

If a shared cache or queue becomes mandatory, it joins the readiness check with the
same contract. If startup validation of the database becomes a deployment
requirement, add an explicit boot check gated by configuration — do not silently
turn readiness into startup.
