'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { NativeSelect } from '@multi-site-cms/ui';

import { useAdmin } from '@/lib/admin-context';
import { getPageWindow, pageRange } from '@/lib/pagination/page-math';

const BUTTON =
  'inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer';
const CURRENT =
  'inline-flex size-9 items-center justify-center rounded-xl border border-brand-600 bg-brand-600 text-white text-xs font-bold shadow-2xs';

export interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly pageSize: number;
  /** Plural noun for the summary, e.g. "posts". */
  readonly itemLabel: string;
  readonly onPageChange: (page: number) => void;
  /** Provide both to let the user choose how many rows to show. */
  readonly pageSizeOptions?: readonly number[];
  readonly onPageSizeChange?: (pageSize: number) => void;
}

/**
 * The one pagination control of the admin: "Showing a–b of n", a rows-per-page
 * selector, first/previous/next/last and a windowed page list. It is purely
 * presentational; pair it with `useUrlPagination` to keep the state in the URL.
 */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationProps) {
  const { t } = useAdmin();
  const canResize = Boolean(onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 1);
  const smallestSize = pageSizeOptions ? Math.min(...pageSizeOptions) : pageSize;

  if (total <= 0) return null;
  // One short page and no meaningful size choice: nothing to control.
  if (totalPages <= 1 && !(canResize && total > smallestSize)) return null;

  const { from, to } = pageRange(page, pageSize, total);
  const items = getPageWindow(page, totalPages);

  return (
    <nav
      aria-label={t.content.pagination}
      className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-slate-600 dark:text-slate-400" aria-live="polite">
          {t.content.showing} {from}–{to} {t.content.of} {total} {itemLabel}
        </span>

        {canResize && pageSizeOptions && onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>{t.content.perPage}</span>
            <NativeSelect
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number.parseInt(value, 10))}
              options={pageSizeOptions.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              aria-label={t.content.perPage}
              className="min-h-0 w-auto gap-1.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
            />
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            className={`${BUTTON} hidden sm:inline-flex`}
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label={t.content.firstPage}
          >
            <ChevronsLeft aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            className={BUTTON}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t.content.previous}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>

          {/* Phones show "page / total"; wider screens get the numbered window. */}
          <span className="px-2 font-semibold text-slate-700 dark:text-slate-300 sm:hidden">
            {page} / {totalPages}
          </span>
          <ul className="hidden items-center gap-1.5 sm:flex">
            {items.map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  {item === page ? (
                    <span aria-current="page" className={CURRENT}>
                      {item}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={BUTTON}
                      onClick={() => onPageChange(item)}
                      aria-label={`${t.content.page} ${item}`}
                    >
                      {item}
                    </button>
                  )}
                </li>
              ) : (
                <li key={item} aria-hidden="true" className="px-1 text-slate-400">
                  …
                </li>
              ),
            )}
          </ul>

          <button
            type="button"
            className={BUTTON}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t.content.next}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
          <button
            type="button"
            className={`${BUTTON} hidden sm:inline-flex`}
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label={t.content.lastPage}
          >
            <ChevronsRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
