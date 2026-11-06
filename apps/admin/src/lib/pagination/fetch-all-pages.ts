/** Largest page the API serves for admin lists (see the `@Max(100)` list DTOs). */
export const ALL_PAGES_LIMIT = 100;
/** Safety bound: 50 pages x 100 rows. Reference lists never get near this. */
const MAX_PAGES = 50;

type PageResult<E> = { data?: unknown; error?: E };

/**
 * Loads every page of a reference list (sites, categories, tags, events) that
 * is rendered whole: dropdowns, tree views, pickers. Without this a list that
 * outgrows the API's default page size silently loses its tail, and an item
 * simply "does not exist" in the UI.
 *
 * Use real pagination (`useUrlPagination` + `Pagination`) for lists people
 * browse; use this for lists the UI needs in full.
 *
 * `fetchPage` receives a 1-based page number and returns an RTK Query result
 * whose `data` is the API envelope (`{ data: [...] }` or `{ data: { items,
 * totalPages } }`).
 */
export async function fetchAllPages<T, E>(
  fetchPage: (page: number) => PromiseLike<PageResult<E>>,
): Promise<{ data: T[]; error?: undefined } | { error: E; data?: undefined }> {
  const all: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchPage(page);
    if (result.error !== undefined) return { error: result.error };

    const payload = (result.data as { data?: unknown } | null | undefined)?.data;

    // An endpoint that is not paginated returns the whole array at once.
    if (Array.isArray(payload)) return { data: payload as T[] };

    const body = payload as { items?: unknown; totalPages?: unknown } | null | undefined;
    const items = Array.isArray(body?.items) ? (body.items as T[]) : [];
    all.push(...items);

    const totalPages = typeof body?.totalPages === 'number' ? body.totalPages : 1;
    if (items.length === 0 || page >= totalPages) break;
  }

  return { data: all };
}
