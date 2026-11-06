import { describe, expect, it } from 'vitest';

import { parseSearchParams, searchHref } from './search-params';

describe('parseSearchParams', () => {
  it('reads valid params', () => {
    expect(
      parseSearchParams({
        q: ' sundarbans ',
        category: 'Nature',
        tag: 'boat-trip',
        sort: 'popular',
        page: '3',
      }),
    ).toEqual({ q: 'sundarbans', category: 'nature', tag: 'boat-trip', sort: 'popular', page: 3 });
  });

  it('falls back on invalid or hostile values', () => {
    expect(parseSearchParams({ category: '../x', tag: 'a b', sort: 'random', page: '-4' })).toEqual(
      { q: '', category: '', tag: '', sort: 'newest', page: 1 },
    );
  });
});

describe('searchHref', () => {
  const state = parseSearchParams({ q: 'tea', category: 'nature', page: '2' });

  it('resets to page 1 when a filter changes and omits defaults', () => {
    expect(searchHref(state, { category: '' })).toBe('/search?q=tea');
    expect(searchHref(state, { sort: 'oldest' })).toBe('/search?q=tea&category=nature&sort=oldest');
  });

  it('keeps an explicit page', () => {
    expect(searchHref(state, { page: 4 })).toBe('/search?q=tea&category=nature&page=4');
  });
});
