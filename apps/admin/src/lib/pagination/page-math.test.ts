import { describe, expect, it } from 'vitest';

import { pageRange, parsePageSize, parsePositiveInt, totalPagesFor } from './page-math';

describe('parsePositiveInt', () => {
  it('accepts positive integers and rejects everything else', () => {
    expect(parsePositiveInt('3', 1)).toBe(3);
    expect(parsePositiveInt('0', 1)).toBe(1);
    expect(parsePositiveInt('-2', 1)).toBe(1);
    expect(parsePositiveInt('2.5', 1)).toBe(1);
    expect(parsePositiveInt('abc', 1)).toBe(1);
    expect(parsePositiveInt('', 7)).toBe(7);
    expect(parsePositiveInt(null, 7)).toBe(7);
    expect(parsePositiveInt('99999999999', 1)).toBe(1);
  });
});

describe('parsePageSize', () => {
  it('only accepts sizes the screen offers', () => {
    expect(parsePageSize('50', [10, 20, 50], 20)).toBe(50);
    expect(parsePageSize('1000', [10, 20, 50], 20)).toBe(20);
    expect(parsePageSize(null, [10, 20, 50], 20)).toBe(20);
  });
});

describe('totalPagesFor / pageRange', () => {
  it('counts pages and never returns fewer than one', () => {
    expect(totalPagesFor(0, 20)).toBe(1);
    expect(totalPagesFor(41, 20)).toBe(3);
    expect(totalPagesFor(40, 20)).toBe(2);
  });

  it('describes the visible item range, clamped to the total', () => {
    expect(pageRange(1, 20, 45)).toEqual({ from: 1, to: 20 });
    expect(pageRange(3, 20, 45)).toEqual({ from: 41, to: 45 });
    expect(pageRange(1, 20, 0)).toEqual({ from: 0, to: 0 });
    // An out-of-range page (e.g. a stale URL) never reports past the end.
    expect(pageRange(9, 20, 45)).toEqual({ from: 45, to: 45 });
  });
});
