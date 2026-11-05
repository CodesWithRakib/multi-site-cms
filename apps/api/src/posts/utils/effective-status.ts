import type { PostStatsStatus } from '@multi-site-cms/types';

/**
 * The status a post shows in the admin workspace, as one SQL expression so
 * that list filtering and status counts can never disagree.
 *
 * - Scoped to a site: the status of the post's publication on that site.
 * - All sites: the most advanced publication status
 *   (published > scheduled > in review > draft > archived).
 * - No publication: the canonical post status.
 *
 * `postAlias` must be the alias of the `posts` table in the outer query. The
 * optional site id is bound as `:effectiveStatusSiteId`.
 */
export function effectiveStatusSql(postAlias: string, scopedToSite: boolean): string {
  const siteCondition = scopedToSite ? 'AND es.site_id = :effectiveStatusSiteId' : '';
  return `COALESCE((
    SELECT es.status FROM post_publications es
    WHERE es.post_id = ${postAlias}.id ${siteCondition}
    ORDER BY CASE es.status
      WHEN 'published' THEN 0
      WHEN 'scheduled' THEN 1
      WHEN 'in_review' THEN 2
      WHEN 'draft' THEN 3
      ELSE 4
    END
    LIMIT 1
  ), ${postAlias}.status)`;
}

export type { PostStatsStatus };

/** Statuses counted by the posts workspace (canonical and publication values). */
export const POST_STATS_STATUSES: readonly PostStatsStatus[] = [
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
];

export function isPostStatsStatus(value: string): value is PostStatsStatus {
  return (POST_STATS_STATUSES as readonly string[]).includes(value);
}
