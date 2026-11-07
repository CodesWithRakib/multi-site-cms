import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseBrowseParams } from './browse';
import { useInfiniteFeed } from './use-infinite-feed';

interface Item {
  readonly id: string;
}

const query = parseBrowseParams({ q: 'tea' });
const first: Item[] = [{ id: 'a' }, { id: 'b' }];

function reply(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 502, json: () => Promise.resolve(body) });
}

function setup(next: Parameters<typeof useInfiniteFeed<Item>>[0]['initialNext']) {
  return renderHook(() =>
    useInfiniteFeed<Item>({
      initialItems: first,
      initialNext: next,
      query,
      endpoint: '/api/articles',
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useInfiniteFeed', () => {
  it('appends the next batch, skips items it already has, and follows the new token', async () => {
    const fetchMock = vi.fn(() =>
      reply({ items: [{ id: 'b' }, { id: 'c' }], next: { kind: 'page', value: 3 } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = setup({ kind: 'page', value: 2 });

    await act(() => result.current.loadMore());

    expect(fetchMock).toHaveBeenCalledWith('/api/articles?q=tea&page=2');
    expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.done).toBe(false);
    expect(result.current.status).toBe('idle');
  });

  it('is done once the CMS returns no next token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => reply({ items: [{ id: 'z' }], next: null })),
    );
    const { result } = setup({ kind: 'cursor', value: 'abc' });

    await act(() => result.current.loadMore());
    expect(result.current.done).toBe(true);
  });

  it('does nothing when there is nowhere to continue', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = setup(null);

    await act(() => result.current.loadMore());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.done).toBe(true);
  });

  it('never starts a second request while one is in flight', async () => {
    let release: () => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Awaited<ReturnType<typeof reply>>>((resolve) => {
          release = () =>
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ items: [], next: null }),
            });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = setup({ kind: 'cursor', value: 'abc' });

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.loadMore();
      void result.current.loadMore();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      release();
      await pending;
    });
  });

  it('reports a failure (not "no more") and succeeds on retry', async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(reply({}, false))
      .mockReturnValueOnce(reply({ items: [{ id: 'c' }], next: null }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = setup({ kind: 'cursor', value: 'abc' });

    await act(() => result.current.loadMore());
    expect(result.current.status).toBe('error');
    expect(result.current.done).toBe(false);
    expect(result.current.items).toHaveLength(2);

    await act(() => result.current.loadMore());
    expect(result.current.status).toBe('idle');
    expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(result.current.done).toBe(true);
  });
});
