import type { PublicEventSummary } from '@multi-site-cms/types';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Nov 6, 2026"; empty string when the timestamp cannot be parsed. */
export function formatPublishedDate(iso: string): string {
  const date = parse(iso);
  return date ? dateFormatter.format(date) : '';
}

/** "Nov 6" or "Nov 6 – Nov 9" for an event window. */
export function formatEventWindow(event: Pick<PublicEventSummary, 'startsAt' | 'endsAt'>): string {
  const start = parse(event.startsAt);
  if (!start) return '';
  const end = event.endsAt ? parse(event.endsAt) : null;
  const startLabel = shortDateFormatter.format(start);
  if (!end) return startLabel;
  const endLabel = shortDateFormatter.format(end);
  return endLabel === startLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

/**
 * Events worth surfacing on the home page: live first, then the soonest
 * scheduled. Completed and cancelled events are left to the events hub.
 */
export function upcomingEvents(
  events: readonly PublicEventSummary[],
  limit: number,
): PublicEventSummary[] {
  const rank = (event: PublicEventSummary) => (event.status === 'live' ? 0 : 1);
  return events
    .filter((event) => event.status === 'live' || event.status === 'scheduled')
    .sort((a, b) => rank(a) - rank(b) || a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}
