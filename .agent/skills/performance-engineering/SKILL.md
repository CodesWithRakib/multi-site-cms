---
name: performance-engineering
description: Optimize query performance, bundle sizes, caching strategies, rendering efficiency, and Core Web Vitals across the platform.
---

# Skill: performance-engineering

## Purpose

Make the platform fast where it is measurable: query shape, payload size,
bundle weight, rendering strategy, and cache correctness.

## When to use

When adding a query, endpoint, list view, media handling, or client dependency —
and whenever a page or endpoint is reported slow.

## Mandatory rules

1. **Measure before optimizing.** Record the baseline (query plan, bundle size,
   response time) and the result. Never claim a speedup without both.
2. **No N+1 queries.** Load related rows with a join or a batched fetch. For a
   list endpoint, the query count must not scale with row count.
3. **Paginate everything that grows.** Cursor or bounded offset with a hard
   maximum page size; no unbounded list endpoint.
4. **Select only what you return.** No `SELECT *` from an entity with large
   columns (body, JSON) for a list view.
5. **Cache deliberately.** Public content is cacheable with a stated freshness
   and invalidation trigger; authenticated responses are `no-store`. Never cache
   an authorization decision across users.
6. **Server-first rendering.** Prefer server rendering and static generation over
   client fetches for public pages. Keep client bundles free of heavy editor and
   admin-only code.
7. **Images and media are bounded.** Use responsive sizes, explicit dimensions to
   avoid layout shift, and lazy loading below the fold.
8. **Indexes match queries.** Every hot filter/sort combination used in
   production has index coverage; verify with `EXPLAIN` on realistic data.

## Workflow

1. Define the metric and the acceptable budget for the change.
2. Measure the current behavior.
3. Identify the dominant cost: query count, payload bytes, bundle weight,
   render blocking, or serialization.
4. Apply the smallest fix that moves the metric.
5. Re-measure and record both numbers in the pull request or ADR note.
6. Add a guard where regression is likely (a test with a row-count assertion, a
   bundle budget, an index in the migration).

## Anti-patterns

- Adding `useMemo`/`memo` before profiling.
- Caching to hide an N+1 instead of fixing the query.
- Client-side filtering of a full table fetch.
- Loading an editor bundle on a read-only page.
- `no-store` everywhere "to be safe", removing all cache benefit.
- Materialized views and denormalized counters with no refresh strategy.
- Claiming latency improvements from a local run on an idle machine.

## Review checklist

- [ ] Baseline and result measured for performance work.
- [ ] Query count independent of list size.
- [ ] Pagination and payload bounds in place.
- [ ] Cache policy stated and correct for the data's sensitivity.
- [ ] Bundle addition justified; heavy code is route- or role-split.
- [ ] Indexes support the new access path.
- [ ] Images sized and lazy-loaded appropriately.

## Project references

- `docs/architecture/erd.md` (index plan)
- `docs/architecture/api-conventions.md` (pagination)
- `packages/api-client/src/api-client.ts` (timeouts)
- `apps/api/src/bootstrap.ts`
