# Next.js Cache Invalidation & On-Demand Revalidation

## Overview

The public frontends (`apps/sites/travel-blog` and `apps/sites/air-sports`) utilize Next.js Incremental Static Regeneration (ISR) for fast response times and SEO performance.

When content is published, updated, unpublished, or archived, the publishing engine dispatches targeted, path-specific cache revalidation webhooks to purge stale static pages immediately.

---

## Path Derivation Architecture

Rather than performing expensive, brute-force cache purges, the `CacheInvalidationService` derives targeted URL paths directly from the publication's relational attributes:

```typescript
const paths: string[] = ['/', `/${slug}`];

if (primaryCategorySlug) {
  paths.push(`/categories/${primaryCategorySlug}`);
}

for (const tagSlug of tagSlugs) {
  paths.push(`/tags/${tagSlug}`);
}
```

### Derived Paths by Lifecycle Event:

| Content State Change | Revalidated Paths                                    | Purpose                                          |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| **Post Published**   | `/`, `/[slug]`, `/categories/[slug]`, `/tags/[slug]` | Renders new article and updates lists/feeds.     |
| **Post Unpublished** | `/`, `/[slug]`, `/categories/[slug]`, `/tags/[slug]` | Evicts published page; `/slug` renders 404.      |
| **Post Archived**    | `/`, `/[slug]`, `/categories/[slug]`, `/tags/[slug]` | Removes link from collections and archives slug. |

---

## Secure Revalidation Protocol

Every public site exposes `POST /api/revalidate`. The contract lives in code in
[`packages/config/src/revalidation.ts`](../../packages/config/src/revalidation.ts)
and is shared by both site route handlers.

1. **Request**

   ```http
   POST /api/revalidate HTTP/1.1
   Content-Type: application/json
   x-revalidate-secret: <REVALIDATE_SECRET>

   { "paths": ["/", "/articles/exploring-swiss-alps"], "tags": ["site:travel-blog"] }
   ```

   Both arrays are optional. Paths must start with a single `/` and contain no
   whitespace, `?`, `#` or `\`; at most 50 items in total. Anything else is `400`.

2. **Authentication** — `REVALIDATE_SECRET` must be set to the same value on the
   API and on each site. Comparison is constant-time. The handler fails closed:
   - secret not configured on the site → `503`
   - header missing or wrong → `401`

   `GET` and query-string secrets are not accepted, so the secret never appears
   in access logs.

3. **Effect** — each site always purges its own site-level fetch tags
   (`travel-blog-content`; `air-sports-content`, `-events`, `-categories`,
   `-tags`), then every tag and path in the payload, then `/`.

### Known gap: the API does not yet call the webhook

`OutboxDispatcherWorker` calls `CacheInvalidationService.revalidatePaths(siteKey, paths)`
without a site base URL, so no request is sent and the result is reported as
`skipped: true`. Published changes therefore appear after the time-based ISR
window (`revalidate = 60` on the site pages), not immediately. Wiring a per-site
base URL is tracked in [`docs/roadmap/MASTER_IMPLEMENTATION_PLAN.md`](../roadmap/MASTER_IMPLEMENTATION_PLAN.md)
(Phase 2).

---

## Resilience & Network Partitions

Because cache invalidation requests are dispatched via the `OutboxDispatcherWorker`:

- Transient network blips or temporary downtime on the Next.js frontend do not fail the publication transaction.
- Failed revalidation calls trigger exponential backoff retries.
- Once the frontend container recovers, all pending cache invalidations are executed in order.
