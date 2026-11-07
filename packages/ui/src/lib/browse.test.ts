import { describe, expect, it } from 'vitest';

import { browseHref, isFiltered, parseBrowseParams } from './browse';

describe('parseBrowseParams', () => {
  it('reads valid params', () => {
    expect(
      parseBrowseParams({
        q: ' sundarbans ',
        category: 'Nature',
        tag: 'boat-trip',
        sort: 'popular',
        page: '3',
      }),
    ).toEqual({ q: 'sundarbans', category: 'nature', tag: 'boat-trip', sort: 'popular', page: 3 });
  });

  it('falls back on invalid or hostile values', () => {
    expect(parseBrowseParams({ category: '../x', tag: 'a b', sort: 'random', page: '-4' })).toEqual(
      { q: '', category: '', tag: '', sort: 'newest', page: 1 },
    );
  });
});

describe('browseHref', () => {
  const state = parseBrowseParams({ q: 'tea', category: 'nature', page: '2' });

  it('resets to page 1 when a filter changes and omits defaults', () => {
    expect(browseHref(state, { category: '' })).toBe('/articles?q=tea');
    expect(browseHref(state, { sort: 'oldest' })).toBe(
      '/articles?q=tea&category=nature&sort=oldest',
    );
  });

  it('keeps an explicit page', () => {
    expect(browseHref(state, { page: 4 })).toBe('/articles?q=tea&category=nature&page=4');
  });

  it('is the bare path with no filters', () => {
    expect(browseHref(parseBrowseParams({}))).toBe('/articles');
  });
});

describe('isFiltered', () => {
  it('is true only when search text, topic or tag narrows the list', () => {
    expect(isFiltered(parseBrowseParams({}))).toBe(false);
    expect(isFiltered(parseBrowseParams({ sort: 'oldest', page: '2' }))).toBe(false);
    expect(isFiltered(parseBrowseParams({ q: 'x' }))).toBe(true);
    expect(isFiltered(parseBrowseParams({ category: 'nature' }))).toBe(true);
    expect(isFiltered(parseBrowseParams({ tag: 'tea' }))).toBe(true);
  });
});
