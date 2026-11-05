# Free-tier deployment strategy

Status: **strategy and constraints only.** No provider is selected, no service is
activated, and no account or credential exists. Choosing a provider is an open
decision that requires approval (Phase 02 entry gate, item 5 in
[phase-01-scope.md](../product/phase-01-scope.md)).

## What must be hosted

| Workload         | Shape                           | Free-tier requirement                                         |
| ---------------- | ------------------------------- | ------------------------------------------------------------- |
| Admin, two sites | Three Next.js applications      | Node runtime, SSR, custom domains, previews                   |
| API              | One long-running NestJS process | Always-on HTTP, no request-duration cap, custom headers       |
| PostgreSQL       | One managed instance            | Persistent storage, connection headroom, `citext` + `pg_trgm` |
| Media (Phase 02) | Object storage + CDN            | Uploads, signed access, egress budget                         |

The workloads are deliberately separable: three independent deployments plus one
database. That is also the portability boundary — each can move providers without
a rewrite.

## Reality check on free tiers

A single free provider rarely covers all four workloads. Next.js hosting is well
served by preview-oriented platforms, but the same platforms typically do not run a
persistent NestJS process or host PostgreSQL. Expect a split:

- **Web (three apps):** a Next.js-optimized host with git previews.
- **API:** a container/Node host with an always-on free instance, or a very cheap
  tier. Run **exactly one** API instance: live updates (SSE) are delivered
  in-process ([ADR-0028](../adr/0028-single-api-instance-for-realtime.md)).
  Disable autoscaling to more than one replica.
- **Database:** a managed PostgreSQL free tier with a hard storage and connection
  cap.

Constraint categories to record for whichever providers are chosen:

| Constraint             | Why it matters here                                                         |
| ---------------------- | --------------------------------------------------------------------------- |
| Sleep / cold start     | A sleeping API makes the admin feel broken and breaks uptime checks         |
| Request duration cap   | Kills long-running report or export endpoints                               |
| Monthly instance hours | A free instance may not cover 24/7                                          |
| DB storage cap         | Media metadata and audit rows grow monotonically                            |
| DB connection cap      | Pooling strategy depends on it; free tiers often cap at tens of connections |
| Egress / bandwidth     | Image-heavy publications consume it fastest                                 |
| Build minutes          | Four app builds per push, per branch                                        |
| Backup retention       | Often none on free tiers — a real risk for real content                     |
| Custom domains         | Two public brands require at least two                                      |
| Commercial-use terms   | Some free tiers restrict commercial projects                                |

Do not rely on a remembered number. When a provider is selected, record its
current published limits in a table here, with the date checked, and link the
pricing page.

## Review checklist before enabling hosting

- [ ] The provider's current free-tier limits are written down in this document.
- [ ] The free tier permits commercial use for these two publications.
- [ ] Previews can use non-production secrets and a disposable database.
- [ ] The database supports `citext` and `pg_trgm` (or the migration creates them).
- [ ] Backups exist, or a scheduled logical dump to external storage does.
- [ ] The API free tier does not sleep in a way that fails the uptime check.
- [ ] Two custom domains and TLS are included.
- [ ] An upgrade path and its monthly cost are known before launch.

## Upgrade path and expected costs

Free tiers are a starting position, not a guarantee. Expect to pay for the first
three things that bind, in this order:

1. **API runtime** — an always-on instance once cold starts hurt editors.
2. **Database** — storage, connection headroom, or automated backups with PITR.
3. **Bandwidth/storage** — image-heavy publications and media egress.

Sequence the spend against a measured limit, and record the decision as a
superseding ADR rather than an undocumented dashboard change. See
[ADR 0006](../adr/0006-free-first-hosting.md).

## Portability rules (already in effect)

- Only environment variables differ between hosts; no host-specific APIs in
  application code.
- PostgreSQL is the system of record, using `citext` and `pg_trgm` — both broadly
  available in managed offerings.
- Object storage is accessed behind an internal interface (Phase 02) so the
  provider can change without touching content code.
- Health is liveness-only, so a provider's platform health check does not imply
  database readiness.

## Cost controls

- One provider per workload; avoid paying twice for the same capability.
- No paid CMS, editor license, or real-time service: Tiptap Core, Socket.IO/SSE,
  and the native database cover those needs.
- No paid observability initially: platform logs plus an uptime check on
  `/api/v1/health` are the minimum.
- Review the bill and the quota dashboard monthly, before a limit is hit.

## Open decisions (require approval)

1. Which host serves the three Next.js applications.
2. Which host runs the API, and whether its free tier is always-on.
3. Which managed PostgreSQL, and whether its free tier includes backups.
4. Media storage provider and access model.
5. The monthly budget ceiling that stops "free-first" from becoming "free only".
