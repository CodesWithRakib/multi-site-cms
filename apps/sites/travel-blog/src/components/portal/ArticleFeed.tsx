'use client';

import { FeedFooter, useInfiniteFeed, type BrowseState, type FeedNext } from '@multi-site-cms/ui';
import type { PublicArticleSummary } from '@multi-site-cms/types';

import { ArticleCardSkeleton } from './ArticleCardSkeleton';
import { PortalArticleGrid } from './PortalArticleGrid';

interface ArticleFeedProps {
  /** The stories already rendered on the server. */
  readonly initialItems: readonly PublicArticleSummary[];
  /** Where the next batch starts; null when the first batch was everything. */
  readonly initialNext: FeedNext | null;
  /** Stories matching the current filters, across every batch. */
  readonly total: number;
  /** The filters in force; also used to highlight the search text. */
  readonly query: BrowseState;
}

/** Skeletons shown while a batch loads; the grid has two columns from `md`. */
const SKELETON_COUNT = 4;

const skeleton = (
  <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
    {Array.from({ length: SKELETON_COUNT }, (_, index) => (
      <ArticleCardSkeleton key={index} />
    ))}
  </div>
);

/** Remount it (via `key`) when the filters change, so a cursor never leaks between lists. */
export function ArticleFeed({ initialItems, initialNext, total, query }: ArticleFeedProps) {
  const feed = useInfiniteFeed<PublicArticleSummary>({
    initialItems,
    initialNext,
    query,
    endpoint: '/api/articles',
  });

  return (
    <div className="space-y-6">
      <PortalArticleGrid articles={[...feed.items]} query={query} />
      <FeedFooter feed={feed} total={total} noun={['story', 'stories']} skeleton={skeleton} />
    </div>
  );
}
