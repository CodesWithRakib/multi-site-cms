import { describe, expect, it } from 'vitest';

import { pageHref, parsePageParam } from './page-param';

describe('parsePageParam', () => {
  it('accepts positive integers', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('7')).toBe(7);
    expect(parsePageParam(['3', '9'])).toBe(3);
  });

  it('falls back to page 1 for anything else', () => {
    for (const bad of [undefined, '', '0', '-2', '2.5', 'abc', '1e3', ' ', '9999999999']) {
      expect(parsePageParam(bad)).toBe(1);
    }
  });

  it('caps absurd pages instead of forwarding them to the API', () => {
    expect(parsePageParam('999999')).toBe(1000);
  });
});

describe('pageHref', () => {
  it('keeps one canonical URL for page 1', () => {
    expect(pageHref('/articles', 1)).toBe('/articles');
    expect(pageHref('/articles', 0)).toBe('/articles');
  });

  it('appends the page, respecting an existing query string', () => {
    expect(pageHref('/articles', 3)).toBe('/articles?page=3');
    expect(pageHref('/articles?category=drones', 2)).toBe('/articles?category=drones&page=2');
  });
});
