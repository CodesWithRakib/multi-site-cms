# ADR-0006: Free-first hosting with documented limits

- Status: Proposed (provider selection needs approval)
- Date: 2026-11-01
- Owners: platform operations

## Context

The platform starts as a small, low-traffic product for two publications. There is
no revenue yet, and the brief requires free and open-source software, no paid
editor license, no paid real-time or CMS service, and no purchased services in
Phase 01. At the same time, free tiers are not production guarantees: they have
quota ceilings, cold starts, connection limits, and policy restrictions.

## Decision

Prioritize free and open-source software and free-tier hosting, with provider
independence and explicit limits.

1. **Framework and libraries are OSS.** Next.js, NestJS, PostgreSQL, TypeORM,
   Redux Toolkit, Tiptap Core, Zod — no per-seat editor or CMS license.
2. **Applications are stateless and provider-portable.** Only environment
   variables differ between hosts; no host-specific runtime APIs in application
   code.
3. **PostgreSQL is the source of truth**, chosen for portability between managed
   free tiers and self-hosting. No proprietary database features required beyond
   `citext` and `pg_trgm`, both available in managed offerings or replaceable.
4. **Media storage is abstracted** behind an internal interface so a provider can
   be swapped without changing content code (Phase 02).
5. **Limits are documented** in
   [free-tier deployment](../deployment/free-tier-deployment.md): quotas, cold
   starts, connection caps, backup availability, and the upgrade path.
6. **Nothing is purchased or activated in Phase 01.** A paid tier is an explicit
   decision, recorded by a superseding ADR, only when a measured limit demands it.

## Alternatives considered

| Option                                    | Why not                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| Paid managed platform from the start      | Premature cost with no traffic justification                                               |
| Vercel-only architecture                  | Frontend hosting is excellent; a long-running API and database still need another provider |
| Self-hosted VPS                           | Cheapest at scale but shifts patching, backups, and TLS to us now                          |
| Supabase-as-backend (auth + DB + storage) | Fast start, but duplicates our RBAC model and increases lock-in                            |
| SQLite                                    | Not multi-instance safe and a poor fit for the future write path                           |

## Consequences

Positive: near-zero operating cost, no license lock-in, portable deployment,
OSS stack that agents and contributors already know.

Negative: cold starts on free API tiers; limited database connections and
backups; quotas that must be monitored; provider terms can change.

Accepted cost: we will likely pay for the API or database before either
publication is heavily trafficked. Scaling horizontally on free tiers multiplies
in-process rate limits and connections, so that becomes a paid decision too.

## Future migration considerations

Migrate one tier at a time, starting with the database when connections or storage
bind. Keep every provider-specific value in environment configuration. Before any
real content exists, verify a restore from a backup — a free tier without a tested
restore is not a backup strategy.
