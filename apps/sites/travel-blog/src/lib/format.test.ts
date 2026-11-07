import { describe, expect, it } from 'vitest';

import { formatPublishedDate, formatShortDate } from './format';

const now = new Date('2026-11-07T12:00:00Z');

describe('formatShortDate', () => {
  it('omits the year for the current year', () => {
    expect(formatShortDate('2026-03-05T12:00:00Z', now)).toBe('Mar 5');
  });

  it('keeps the year for other years', () => {
    expect(formatShortDate('2025-12-30T12:00:00Z', now)).toBe('Dec 30, 2025');
  });

  it('returns an empty string for an unparseable date', () => {
    expect(formatShortDate('not a date', now)).toBe('');
    expect(formatPublishedDate('not a date')).toBe('');
  });
});
