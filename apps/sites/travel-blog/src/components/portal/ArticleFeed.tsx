'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import type { BrowseState } from '@/lib/browse-params';
import { feedQueryString, type FeedNext } from '@/lib/feed-request';

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

type Status = 'idle' | 'loading' | 'error';

interface FeedResponse {
  readonly items: PublicArticleSummary[];
  readonly next: FeedNext | null;
}

/** Skeletons shown while a batch loads; the grid has two columns from `md`. */
const SKELETON_COUNT = 4;

/**
 * Infinite-scroll story list. The server renders the first batch (so it is
 * indexable and instant); the rest load as the reader nears the end. Newest-first
 * lists continue from the CMS cursor, so stories are never skipped or repeated
 * even when new ones are published meanwhile. Remount it (via `key`) when the
 * filters change.
 */
export function ArticleFeed({ initialItems, initialNext, total, query }: ArticleFeedProps) {
  const [items, setItems] = useState<readonly PublicArticleSummary[]>(initialItems);
  const [next, setNext] = useState<FeedNext | null>(initialNext);
  const [status, setStatus] = useState<Status>('idle');
  const sentinel = useRef<HTMLDivElement>(null);
  // A ref (not state) so two quick intersections cannot start two requests.
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    try {
      const res = await fetch(`/api/articles?${feedQueryString(query, next)}`);
      if (!res.ok) throw new Error(`Feed request failed (${res.status})`);
      const batch = (await res.json()) as FeedResponse;

      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...batch.items.filter((item) => !seen.has(item.id))];
      });
      setNext(batch.next);
      setStatus('idle');
    } catch {
      setStatus('error');
    } finally {
      inFlight.current = false;
    }
  }, [next, query]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !next || status !== 'idle') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      // Start early so the next batch is usually ready before the reader arrives.
      { rootMargin: '0px 0px 700px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [next, status, loadMore]);

  const done = next === null;

  return (
    <div className="space-y-6">
      <PortalArticleGrid articles={[...items]} query={query} />

      {status === 'loading' && (
        <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-semibold text-foreground">More stories could not be loaded.</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Try again
          </button>
        </div>
      )}

      {/* Triggers the next batch; also a fallback button for browsers without observers. */}
      {!done && status === 'idle' && (
        <div ref={sentinel} className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Loader2 aria-hidden="true" className="size-4 text-muted-foreground" />
            Load more stories
          </button>
        </div>
      )}

      <p role="status" className="text-center text-xs text-muted-foreground">
        {done
          ? items.length > 0
            ? `You have reached the end: all ${total} ${total === 1 ? 'story' : 'stories'} shown.`
            : ''
          : status === 'loading'
            ? 'Loading more stories…'
            : `Showing ${items.length} of ${total} stories.`}
      </p>
    </div>
  );
}
