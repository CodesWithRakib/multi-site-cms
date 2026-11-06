const MAX_PAGE = 1000;

/**
 * Reads `?page=` from an untrusted URL into a positive integer. Missing,
 * non-numeric, fractional, zero or negative values are page 1; absurdly large
 * values are capped so a crafted URL cannot ask the API for page 10^9.
 */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
  if (!/^\d{1,9}$/.test(raw)) return 1;
  const page = Number.parseInt(raw, 10);
  return page >= 1 ? Math.min(page, MAX_PAGE) : 1;
}

/** `/articles` for page 1, `/articles?page=3` otherwise (page 1 has one canonical URL). */
export function pageHref(base: string, page: number): string {
  if (page <= 1) return base;
  return `${base}${base.includes('?') ? '&' : '?'}page=${page}`;
}
