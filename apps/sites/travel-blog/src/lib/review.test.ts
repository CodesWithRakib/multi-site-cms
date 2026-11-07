import { describe, expect, it } from 'vitest';

import {
  addRating,
  EMPTY_BREAKDOWN,
  ratingLabel,
  validateReview,
  type RatingSummary,
} from './review';

const valid = { name: 'Maya Lin', email: 'maya@example.com', content: 'Loved the boat trip.' };

describe('validateReview', () => {
  it('accepts a complete review', () => {
    expect(validateReview(valid)).toEqual({});
  });

  it('reports each missing field separately', () => {
    expect(Object.keys(validateReview({ name: ' ', email: '', content: '' })).sort()).toEqual([
      'content',
      'email',
      'name',
    ]);
  });

  it.each(['maya', 'maya@', '@example.com', 'maya@example', 'ma ya@example.com'])(
    'rejects the email %s',
    (email) => {
      expect(validateReview({ ...valid, email }).email).toBeTruthy();
    },
  );

  it('enforces the minimum lengths after trimming', () => {
    expect(validateReview({ ...valid, name: ' A ' }).name).toBeTruthy();
    expect(validateReview({ ...valid, content: ' ok ' }).content).toBeTruthy();
    expect(validateReview({ ...valid, content: 'fine' }).content).toBeUndefined();
  });
});

describe('ratingLabel', () => {
  it('names each star level and is empty for no rating', () => {
    expect(ratingLabel(1)).toBe('Poor');
    expect(ratingLabel(5)).toBe('Excellent');
    expect(ratingLabel(null)).toBe('');
  });
});

describe('addRating', () => {
  const base: RatingSummary = {
    average: 4.5,
    count: 2,
    breakdown: { ...EMPTY_BREAKDOWN, 4: 1, 5: 1 },
  };

  it('recomputes the average from the breakdown, not from the total number of comments', () => {
    const next = addRating(base, 3);
    expect(next.count).toBe(3);
    expect(next.breakdown).toEqual({ 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 });
    expect(next.average).toBe(4);
  });

  it('starts an average from nothing', () => {
    expect(addRating({ average: null, count: 0, breakdown: EMPTY_BREAKDOWN }, 5)).toEqual({
      average: 5,
      count: 1,
      breakdown: { ...EMPTY_BREAKDOWN, 5: 1 },
    });
  });

  it('ignores a review without a valid rating', () => {
    expect(addRating(base, null)).toBe(base);
    expect(addRating(base, 0)).toBe(base);
    expect(addRating(base, 6)).toBe(base);
  });
});
