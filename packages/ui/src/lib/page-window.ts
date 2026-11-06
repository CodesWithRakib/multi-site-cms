export type PageWindowItem = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Page numbers to render: always the first and last page, the current page
 * with `siblings` on each side, and an ellipsis for each gap. A gap of exactly
 * one page shows that page instead of an ellipsis, so the control never jumps
 * in width by hiding a single number.
 *
 * Shared by the admin and both public sites, so every list pages the same way.
 */
export function getPageWindow(page: number, totalPages: number, siblings = 1): PageWindowItem[] {
  if (totalPages <= 1) return [1];

  const current = Math.min(Math.max(1, page), totalPages);
  const first = 1;
  const last = totalPages;
  const start = Math.max(first + 1, current - siblings);
  const end = Math.min(last - 1, current + siblings);

  const items: PageWindowItem[] = [first];

  if (start > first + 2) items.push('ellipsis-start');
  else if (start === first + 2) items.push(first + 1);

  for (let value = start; value <= end; value += 1) items.push(value);

  if (end < last - 2) items.push('ellipsis-end');
  else if (end === last - 2) items.push(last - 1);

  items.push(last);
  return items;
}
