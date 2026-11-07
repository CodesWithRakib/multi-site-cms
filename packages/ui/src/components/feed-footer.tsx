import type { ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

import type { InfiniteFeed } from '../lib/use-infinite-feed';

export interface FeedFooterProps {
  readonly feed: Pick<
    InfiniteFeed<unknown>,
    'items' | 'status' | 'done' | 'loadMore' | 'sentinelRef'
  >;
  /** Items matching the current filters, across every batch. */
  readonly total: number;
  /** Singular and plural noun for the status line, e.g. `story` / `stories`. */
  readonly noun: readonly [singular: string, plural: string];
  /** Placeholder cards shown while a batch loads (site-specific shape). */
  readonly skeleton: ReactNode;
}

/**
 * Everything under an infinite list: loading placeholders, a retry on failure,
 * a sentinel (that is also a plain "load more" button for browsers without
 * observers) and a polite status line. Colors come from semantic tokens, so
 * each site keeps its own branding.
 */
export function FeedFooter({ feed, total, noun, skeleton }: FeedFooterProps) {
  const { items, status, done, loadMore, sentinelRef } = feed;
  const [one, many] = noun;
  const label = total === 1 ? one : many;

  return (
    <div className="space-y-6">
      {status === 'loading' && skeleton}

      {status === 'error' && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm font-semibold text-foreground">More {many} could not be loaded.</p>
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

      {!done && status === 'idle' && (
        <div ref={sentinelRef} className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <Loader2 aria-hidden="true" className="size-4 text-muted-foreground" />
            Load more {many}
          </button>
        </div>
      )}

      <p role="status" className="text-center text-xs text-muted-foreground">
        {done
          ? items.length > 0
            ? `You have reached the end: all ${total} ${label} shown.`
            : ''
          : status === 'loading'
            ? `Loading more ${many}…`
            : `Showing ${items.length} of ${total} ${many}.`}
      </p>
    </div>
  );
}
