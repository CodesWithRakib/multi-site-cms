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

The CMS communicates with the target site's on-demand revalidation route (e.g., `POST /api/revalidate`) using shared secret authentication:

1. **Webhook Request Headers**:

   ```http
   POST /api/revalidate HTTP/1.1
   Host: travelblog.internal
   Content-Type: application/json
   x-revalidation-secret: <REVALIDATION_SECRET>
   ```

2. **Webhook Request Payload**:

   ```json
   {
     "paths": ["/", "/exploring-swiss-alps", "/categories/alps", "/tags/hiking"],
     "slug": "exploring-swiss-alps",
     "timestamp": "2026-11-01T12:00:00.000Z"
   }
   ```

3. **Frontend Validation**:
   The Next.js route handler verifies `request.headers.get('x-revalidation-secret') === process.env.REVALIDATION_SECRET`. Unauthenticated or forged revalidation requests receive an immediate `401 Unauthorized`.
   Upon verification, Next.js executes `revalidatePath(path)` for each derived route.

---

## Resilience & Network Partitions

Because cache invalidation requests are dispatched via the `OutboxDispatcherWorker`:

- Transient network blips or temporary downtime on the Next.js frontend do not fail the publication transaction.
- Failed revalidation calls trigger exponential backoff retries.
- Once the frontend container recovers, all pending cache invalidations are executed in order.
