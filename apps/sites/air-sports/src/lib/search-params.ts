import type { PublicPostSort } from '@multi-site-cms/types';

export interface SearchState {
  readonly q: string;
  readonly category: string;
  readonly tag: string;
  readonly sort: PublicPostSort;
  readonly page: number;
}

export const SEARCH_SORTS: ReadonlyArray<{ value: PublicPostSort; label: string }> = [
  { value: 'newest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_asc', label: 'A–Z' },
];

const SORT_VALUES = new Set<string>(SEARCH_SORTS.map((sort) => sort.value));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RawParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

/** Reads untrusted URL params into a valid search state (bad values fall back). */
export function parseSearchParams(raw: RawParams): SearchState {
  const sort = first(raw.sort);
  const category = first(raw.category).toLowerCase();
  const tag = first(raw.tag).toLowerCase();
  const page = Number.parseInt(first(raw.page), 10);
  return {
    q: first(raw.q).slice(0, 100),
    category: SLUG.test(category) ? category : '',
    tag: SLUG.test(tag) ? tag : '',
    sort: SORT_VALUES.has(sort) ? (sort as PublicPostSort) : 'newest',
    page: Number.isFinite(page) && page > 1 ? Math.min(page, 1000) : 1,
  };
}

/**
 * URL for the search page with some fields changed. Changing any filter
 * resets to page 1 unless a page is given explicitly.
 */
export function searchHref(state: SearchState, change: Partial<SearchState>): string {
  const next = { ...state, page: 1, ...change };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.category) params.set('category', next.category);
  if (next.tag) params.set('tag', next.tag);
  if (next.sort !== 'newest') params.set('sort', next.sort);
  if (next.page > 1) params.set('page', String(next.page));
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

/** Page numbers to show, with null for a gap: 1 … 4 5 6 … 12. */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) out.push(null);
    out.push(page);
  });
  return out;
}
