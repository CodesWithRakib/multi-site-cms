import { describe, expect, it, vi } from 'vitest';

import { fetchAllPages } from './fetch-all-pages';

const envelope = (data: unknown) => ({ data: { data } });

describe('fetchAllPages', () => {
  it('walks every page and concatenates the items in order', async () => {
    const pages = [
      envelope({ items: [1, 2], totalPages: 3 }),
      envelope({ items: [3, 4], totalPages: 3 }),
      envelope({ items: [5], totalPages: 3 }),
    ];
    const fetchPage = vi.fn(async (page: number) => pages[page - 1]!);

    const result = await fetchAllPages<number, string>(fetchPage);

    expect(result).toEqual({ data: [1, 2, 3, 4, 5] });
    expect(fetchPage.mock.calls.map(([page]) => page)).toEqual([1, 2, 3]);
  });

  it('returns a plain array endpoint as is, after a single request', async () => {
    const fetchPage = vi.fn(async () => envelope(['a', 'b']));
    expect(await fetchAllPages<string, string>(fetchPage)).toEqual({ data: ['a', 'b'] });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('stops on a single page and on an unexpectedly empty page', async () => {
    const one = vi.fn(async () => envelope({ items: ['x'], totalPages: 1 }));
    expect(await fetchAllPages<string, string>(one)).toEqual({ data: ['x'] });
    expect(one).toHaveBeenCalledTimes(1);

    // totalPages claims more, but the API returns nothing: do not spin.
    const hollow = vi.fn(async () => envelope({ items: [], totalPages: 9 }));
    expect(await fetchAllPages<string, string>(hollow)).toEqual({ data: [] });
    expect(hollow).toHaveBeenCalledTimes(1);
  });

  it('surfaces the first error and discards partial data', async () => {
    const fetchPage = vi.fn(async (page: number) =>
      page === 1 ? envelope({ items: [1], totalPages: 2 }) : { error: 'boom' },
    );
    expect(await fetchAllPages<number, string>(fetchPage)).toEqual({ error: 'boom' });
  });

  it('treats a malformed payload as empty rather than throwing', async () => {
    expect(await fetchAllPages<number, string>(async () => envelope(null))).toEqual({ data: [] });
    expect(await fetchAllPages<number, string>(async () => ({ data: null }))).toEqual({ data: [] });
  });
});
