const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Nov 6, 2026" for an ISO timestamp; empty string when it cannot be parsed. */
export function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

const shortFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/**
 * Compact date for tight spots such as card footers: "Nov 7" within the current
 * year, "Nov 7, 2025" for older stories so the year is never ambiguous.
 */
export function formatShortDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear() === now.getFullYear()
    ? shortFormatter.format(date)
    : dateFormatter.format(date);
}
