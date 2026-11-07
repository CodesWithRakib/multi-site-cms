import { describe, expect, it } from 'vitest';

import { parseBrowseParams } from './browse-params';
import { FEED_PAGE_SIZE, feedQueryString, nextToken, parseFeedRequest } from './feed-request';

const parse = (qs: string) => parseFeedRequest(new URLSearchParams(qs));

describe('parseFeedRequest', () => {
  it('uses the default page size and no filters for an empty query', () => {
    const request = parse('');
    expect(request?.limit).toBe(FEED_PAGE_SIZE);
    expect(request?.next).toBeNull();
    expect(request?.state).toEqual(parseBrowseParams({}));
  });

  it('accepts search text, filters, sort and a cursor', () => {
    expect(parse('q=tea&category=Food-Travel&tag=sylhet&cursor=eyJ0IjoiMSJ9&limit=6')).toEqual({
      state: { q: 'tea', category: 'food-travel', tag: 'sylhet', sort: 'newest', page: 1 },
      next: { kind: 'cursor', value: 'eyJ0IjoiMSJ9' },
      limit: 6,
    });
  });

  it('continues other sort orders by page number', () => {
    expect(parse('sort=popular&page=3')?.next).toEqual({ kind: 'page', value: 3 });
  });

  it.each([
    'cursor=a b',
    "cursor=a'b",
    'cursor=../etc/passwd',
    `cursor=${'a'.repeat(201)}`,
    'cursor=abc&sort=oldest',
    'cursor=abc&page=2',
    'category=Food Travel',
    'category=../x',
    'category=a--b_c',
    'tag=a b',
    'sort=random',
    'page=abc',
    'page=-2',
    'limit=0',
    'limit=25',
    'limit=-1',
    'limit=abc',
    'limit=1e3',
  ])('rejects %s', (qs) => {
    expect(parse(qs)).toBeNull();
  });
});

describe('nextToken', () => {
  it('prefers the cursor the CMS returned', () => {
    expect(nextToken({ nextCursor: 'abc', page: 1, totalPages: 5 }, 'newest')).toEqual({
      kind: 'cursor',
      value: 'abc',
    });
  });

  it('pages through orders that have no cursor, until the last page', () => {
    expect(nextToken({ nextCursor: null, page: 2, totalPages: 4 }, 'popular')).toEqual({
      kind: 'page',
      value: 3,
    });
    expect(nextToken({ nextCursor: null, page: 4, totalPages: 4 }, 'popular')).toBeNull();
  });

  it('ends a newest-first list when there is no cursor', () => {
    expect(nextToken({ nextCursor: null, page: 1, totalPages: 3 }, 'newest')).toBeNull();
  });
});

describe('feedQueryString', () => {
  const state = parseBrowseParams({ q: 'tea', category: 'nature', sort: 'oldest', page: '5' });

  it('carries the filters and the cursor, but never the page the server started on', () => {
    expect(feedQueryString({ ...state, sort: 'newest' }, { kind: 'cursor', value: 'abc' })).toBe(
      'q=tea&category=nature&cursor=abc',
    );
  });

  it('carries the page for orders without a cursor', () => {
    expect(feedQueryString(state, { kind: 'page', value: 3 })).toBe(
      'q=tea&category=nature&sort=oldest&page=3',
    );
  });
});
