import type { PublicPostSort } from '@multi-site-cms/types';

/** Everything the stories page can be filtered or ordered by; mirrored in the URL. */
export interface BrowseState {
  readonly q: string;
  readonly category: string;
  readonly tag: string;
  readonly sort: PublicPostSort;
  readonly page: number;
}

export const BROWSE_SORTS: ReadonlyArray<{ value: PublicPostSort; label: string }> = [
  { value: 'newest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title_asc', label: 'A–Z' },
];

export const BROWSE_PATH = '/articles';

const SORT_VALUES = new Set<string>(BROWSE_SORTS.map((sort) => sort.value));
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type RawParams = Readonly<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

/** Reads untrusted URL params into a valid state (bad values fall back to the default). */
export function parseBrowseParams(raw: RawParams): BrowseState {
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

/** The query string for a state (defaults omitted), shared by page links and feed requests. */
export function browseParams(state: BrowseState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category) params.set('category', state.category);
  if (state.tag) params.set('tag', state.tag);
  if (state.sort !== 'newest') params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  return params;
}

/**
 * URL of the stories page with some fields changed. Changing any filter
 * resets to page 1 unless a page is given explicitly.
 */
export function browseHref(state: BrowseState, change: Partial<BrowseState> = {}): string {
  const query = browseParams({ ...state, page: 1, ...change }).toString();
  return query ? `${BROWSE_PATH}?${query}` : BROWSE_PATH;
}

/** True when anything narrows the list (search text, topic or tag). */
export function isFiltered(state: BrowseState): boolean {
  return Boolean(state.q || state.category || state.tag);
}
