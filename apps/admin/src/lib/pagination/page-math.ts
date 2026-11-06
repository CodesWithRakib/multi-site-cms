/** Page sizes offered by every list unless a screen needs its own (e.g. media grids). */
export const DEFAULT_PAGE_SIZES: readonly number[] = [10, 20, 50, 100];

/** Reads a positive integer from a URL parameter; anything else is the fallback. */
export function parsePositiveInt(value: string | null | undefined, fallback: number): number {
  if (!value || !/^\d{1,9}$/.test(value)) return fallback;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 1 ? parsed : fallback;
}

/** Reads a page size; only values the screen offers are accepted. */
export function parsePageSize(
  value: string | null | undefined,
  allowed: readonly number[],
  fallback: number,
): number {
  const parsed = parsePositiveInt(value, fallback);
  return allowed.includes(parsed) ? parsed : fallback;
}

export function totalPagesFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, pageSize)));
}

/** 1-based inclusive item range shown on a page, e.g. `{ from: 21, to: 40 }`. */
export function pageRange(
  page: number,
  pageSize: number,
  total: number,
): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };
  const from = (page - 1) * pageSize + 1;
  return { from: Math.min(from, total), to: Math.min(page * pageSize, total) };
}

// One implementation for the admin and both public sites.
export { getPageWindow, type PageWindowItem } from '@multi-site-cms/ui';
