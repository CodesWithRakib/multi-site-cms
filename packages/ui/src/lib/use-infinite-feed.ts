'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

import type { BrowseState } from './browse';
import { feedQueryString, type FeedNext } from './feed';

export type FeedStatus = 'idle' | 'loading' | 'error';

interface FeedResponse<T> {
  readonly items: T[];
  readonly next: FeedNext | null;
}

export interface UseInfiniteFeedOptions<T extends { readonly id: string }> {
  /** The items the server already rendered. */
  readonly initialItems: readonly T[];
  /** Where the next batch starts; null when the first batch was everything. */
  readonly initialNext: FeedNext | null;
  /** The filters in force; the same state the page was rendered from. */
  readonly query: BrowseState;
  /** Route handler that returns `{ items, next }`, e.g. `/api/articles`. */
  readonly endpoint: string;
  /** How close to the end (in px) the next batch starts loading. */
  readonly rootMarginPx?: number;
}

export interface InfiniteFeed<T> {
  readonly items: readonly T[];
  readonly status: FeedStatus;
  /** True once the last batch has been loaded. */
  readonly done: boolean;
  readonly loadMore: () => Promise<void>;
  /** Attach to an element after the list: reaching it loads the next batch. */
  readonly sentinelRef: RefObject<HTMLDivElement | null>;
}

/**
 * Infinite-scroll state shared by every site's story list. The server renders
 * the first batch (indexable and instant); this loads the rest as the reader
 * nears the end. It never loads two batches at once, drops items it already
 * has, and distinguishes "no more" from "failed" so a failure can be retried.
 * Remount it (via `key`) when the filters change.
 */
export function useInfiniteFeed<T extends { readonly id: string }>({
  initialItems,
  initialNext,
  query,
  endpoint,
  rootMarginPx = 700,
}: UseInfiniteFeedOptions<T>): InfiniteFeed<T> {
  const [items, setItems] = useState<readonly T[]>(initialItems);
  const [next, setNext] = useState<FeedNext | null>(initialNext);
  const [status, setStatus] = useState<FeedStatus>('idle');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // A ref (not state) so two quick intersections cannot start two requests.
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (!next || inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');
    try {
      const res = await fetch(`${endpoint}?${feedQueryString(query, next)}`);
      if (!res.ok) throw new Error(`Feed request failed (${res.status})`);
      const batch = (await res.json()) as FeedResponse<T>;

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
  }, [next, query, endpoint]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !next || status !== 'idle') return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      // Start early so the next batch is usually ready before the reader arrives.
      { rootMargin: `0px 0px ${rootMarginPx}px 0px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [next, status, loadMore, rootMarginPx]);

  return { items, status, done: next === null, loadMore, sentinelRef };
}
