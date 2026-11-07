import { describe, expect, it } from 'vitest';

import type { PublicEventSummary } from '@multi-site-cms/types';

import { formatDateTile, formatEventWindow, formatPublishedDate, upcomingEvents } from './format';

function event(overrides: Partial<PublicEventSummary>): PublicEventSummary {
  return {
    id: 'id',
    slug: 'slug',
    name: 'Event',
    status: 'scheduled',
    startsAt: '2026-11-10T09:00:00.000Z',
    endsAt: null,
    description: null,
    updateCount: 0,
    ...overrides,
  };
}

describe('formatPublishedDate', () => {
  it('formats a valid timestamp and tolerates garbage', () => {
    expect(formatPublishedDate('2026-11-06T12:00:00.000Z')).toBe('Nov 6, 2026');
    expect(formatPublishedDate('not-a-date')).toBe('');
  });
});

describe('formatEventWindow', () => {
  it('shows a single day or a range', () => {
    expect(formatEventWindow(event({ startsAt: '2026-11-10T12:00:00Z' }))).toBe('Nov 10');
    expect(
      formatEventWindow(
        event({ startsAt: '2026-11-10T12:00:00Z', endsAt: '2026-11-12T12:00:00Z' }),
      ),
    ).toBe('Nov 10 – Nov 12');
  });
});

describe('upcomingEvents', () => {
  it('puts live events first, then the soonest scheduled, and drops finished ones', () => {
    const events = [
      event({ id: 'late', startsAt: '2026-12-01T00:00:00Z' }),
      event({ id: 'done', status: 'completed' }),
      event({ id: 'soon', startsAt: '2026-11-08T00:00:00Z' }),
      event({ id: 'live', status: 'live', startsAt: '2026-11-20T00:00:00Z' }),
      event({ id: 'off', status: 'cancelled' }),
    ];
    expect(upcomingEvents(events, 3).map((e) => e.id)).toEqual(['live', 'soon', 'late']);
    expect(upcomingEvents(events, 1).map((e) => e.id)).toEqual(['live']);
  });
});

describe('formatDateTile', () => {
  it('splits a date into a day number and an upper-case month', () => {
    expect(formatDateTile('2027-01-14T12:00:00.000Z')).toEqual({ day: '14', month: 'JAN' });
  });

  it('is empty for an unparseable date', () => {
    expect(formatDateTile('nope')).toEqual({ day: '', month: '' });
  });
});
