import { describe, expect, it } from 'vitest';

import { pageWindow, parseSearchParams, searchHref } from './search-params';

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

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('collapses distant pages into gaps', () => {
    expect(pageWindow(6, 12)).toEqual([1, null, 5, 6, 7, null, 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, null, 12]);
  });
});
