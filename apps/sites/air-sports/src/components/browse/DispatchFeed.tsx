'use client';

import { FeedFooter, useInfiniteFeed, type BrowseState, type FeedNext } from '@multi-site-cms/ui';
import type { PublicArticleSummary } from '@multi-site-cms/types';

import { DispatchGrid } from './DispatchGrid';
import { DispatchSkeleton } from './DispatchSkeleton';

interface DispatchFeedProps {
  /** The dispatches already rendered on the server. */
  readonly initialItems: readonly PublicArticleSummary[];
  readonly initialNext: FeedNext | null;
  /** Dispatches matching the current filters, across every batch. */
  readonly total: number;
  readonly query: BrowseState;
}

const skeleton = (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }, (_, index) => (
      <DispatchSkeleton key={index} />
    ))}
  </div>
);

/** Remount it (via `key`) when the filters change, so a cursor never leaks between lists. */
export function DispatchFeed({ initialItems, initialNext, total, query }: DispatchFeedProps) {
  const feed = useInfiniteFeed<PublicArticleSummary>({
    initialItems,
    initialNext,
    query,
    endpoint: '/api/articles',
  });

  return (
    <div className="space-y-6">
      <DispatchGrid articles={feed.items} query={query} />
      <FeedFooter feed={feed} total={total} noun={['dispatch', 'dispatches']} skeleton={skeleton} />
    </div>
  );
}
