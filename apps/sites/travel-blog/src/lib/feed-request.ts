import { browseParams, parseBrowseParams, type BrowseState } from './browse-params';

/** Stories loaded per scroll step, and the most a client may ask for. */
export const FEED_PAGE_SIZE = 12;
const MAX_LIMIT = 24;

/** Cursors are opaque base64url strings; anything else never reaches the CMS API. */
const CURSOR = /^[A-Za-z0-9_-]{1,200}$/;

/**
 * Where the next batch starts. Newest-first lists continue from a cursor (so a
 * story published meanwhile is never skipped or repeated); other orders have no
 * stable cursor and continue by page number.
 */
export type FeedNext =
  | { readonly kind: 'cursor'; readonly value: string }
  | { readonly kind: 'page'; readonly value: number };

/** What the CMS reported about a batch; the fields needed to decide what follows. */
export interface FeedBatch {
  readonly nextCursor: string | null;
  readonly page: number;
  readonly totalPages: number;
}

/** The token for the batch after `batch`, or null when it was the last one. */
export function nextToken(batch: FeedBatch, sort: BrowseState['sort']): FeedNext | null {
  if (batch.nextCursor) return { kind: 'cursor', value: batch.nextCursor };
  if (sort !== 'newest' && batch.page < batch.totalPages) {
    return { kind: 'page', value: batch.page + 1 };
  }
  return null;
}

export interface FeedRequest {
  readonly state: BrowseState;
  readonly next: FeedNext | null;
  readonly limit: number;
}

/** Query string for one feed request: the filters plus where to continue. */
export function feedQueryString(state: BrowseState, next: FeedNext | null): string {
  const params = browseParams({ ...state, page: 1 });
  if (next?.kind === 'cursor') params.set('cursor', next.value);
  if (next?.kind === 'page') params.set('page', String(next.value));
  return params.toString();
}

/** A raw value that was present but did not survive sanitising is a malformed request. */
function dropped(raw: string | null, clean: string): boolean {
  return Boolean(raw?.trim()) && !clean;
}

/** Validates a feed query string; null means the request is malformed. */
export function parseFeedRequest(params: URLSearchParams): FeedRequest | null {
  const raw = Object.fromEntries(params.entries());
  const state = parseBrowseParams(raw);

  if (dropped(params.get('category'), state.category)) return null;
  if (dropped(params.get('tag'), state.tag)) return null;
  const sort = params.get('sort');
  if (sort && sort !== state.sort) return null;

  const cursor = params.get('cursor')?.trim() || undefined;
  if (cursor && (!CURSOR.test(cursor) || state.sort !== 'newest')) return null;

  const rawPage = params.get('page');
  if (rawPage !== null && !/^\d{1,4}$/.test(rawPage)) return null;
  if (cursor && rawPage) return null;

  const rawLimit = params.get('limit');
  let limit = FEED_PAGE_SIZE;
  if (rawLimit !== null) {
    if (!/^\d{1,3}$/.test(rawLimit)) return null;
    limit = Number.parseInt(rawLimit, 10);
    if (limit < 1 || limit > MAX_LIMIT) return null;
  }

  const next: FeedNext | null = cursor
    ? { kind: 'cursor', value: cursor }
    : state.page > 1
      ? { kind: 'page', value: state.page }
      : null;

  return { state, next, limit };
}
