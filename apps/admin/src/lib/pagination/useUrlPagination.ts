'use client';

import { useCallback, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { DEFAULT_PAGE_SIZES, parsePageSize, parsePositiveInt } from './page-math';

export interface UrlPaginationOptions {
  /** Page size when `?limit=` is absent or not one of `limits`. */
  readonly defaultLimit?: number;
  /** Page sizes the screen offers; anything else in the URL is ignored. */
  readonly limits?: readonly number[];
}

export interface UrlPagination {
  readonly page: number;
  readonly limit: number;
  readonly limits: readonly number[];
  /** Pushes `?page=n` so Back/Forward walk through pages. */
  readonly setPage: (page: number) => void;
  /** Like `setPage` but without a history entry (for corrections). */
  readonly replacePage: (page: number) => void;
  /** Changes the size and returns to page 1. */
  readonly setLimit: (limit: number) => void;
  /** Back to page 1 (call when a filter changes). */
  readonly resetPage: () => void;
}

/**
 * Page and page size kept in the URL (`?page=3&limit=50`), so a list is
 * shareable, survives a reload and works with the browser's Back button.
 * Defaults are omitted to keep URLs clean, and unrelated parameters are kept.
 *
 * Needs a Suspense boundary above it (the admin root layout provides one).
 */
export function useUrlPagination({
  defaultLimit = 20,
  limits = DEFAULT_PAGE_SIZES,
}: UrlPaginationOptions = {}): UrlPagination {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePositiveInt(searchParams.get('page'), 1);
  const limit = parsePageSize(searchParams.get('limit'), limits, defaultLimit);

  const navigate = useCallback(
    (mutate: (params: URLSearchParams) => void, mode: 'push' | 'replace') => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const query = next.toString();
      router[mode](query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setPage = useCallback(
    (value: number) =>
      navigate((params) => {
        if (value <= 1) params.delete('page');
        else params.set('page', String(value));
      }, 'push'),
    [navigate],
  );

  const replacePage = useCallback(
    (value: number) =>
      navigate((params) => {
        if (value <= 1) params.delete('page');
        else params.set('page', String(value));
      }, 'replace'),
    [navigate],
  );

  const setLimit = useCallback(
    (value: number) =>
      navigate((params) => {
        params.delete('page');
        if (value === defaultLimit) params.delete('limit');
        else params.set('limit', String(value));
      }, 'replace'),
    [defaultLimit, navigate],
  );

  const resetPage = useCallback(() => {
    if (!searchParams.has('page')) return;
    navigate((params) => params.delete('page'), 'replace');
  }, [navigate, searchParams]);

  return { page, limit, limits, setPage, replacePage, setLimit, resetPage };
}

/**
 * Corrects a stale URL: if `?page=` is past the last page (a shared link after
 * rows were deleted, or deleting the last row of the last page), move to the
 * last page instead of showing an empty list.
 */
export function useClampPage(
  pagination: Pick<UrlPagination, 'page' | 'replacePage'>,
  totalPages: number,
  isReady: boolean,
): void {
  const { page, replacePage } = pagination;
  useEffect(() => {
    if (isReady && totalPages >= 1 && page > totalPages) replacePage(totalPages);
  }, [isReady, page, totalPages, replacePage]);
}
