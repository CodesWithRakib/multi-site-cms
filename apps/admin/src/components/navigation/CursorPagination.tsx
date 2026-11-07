'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { NativeSelect } from '@multi-site-cms/ui';

import { useAdmin } from '@/lib/admin-context';

const BUTTON =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-40 cursor-pointer';

export interface CursorPaginationProps {
  /** Rows on the current page. */
  readonly shown: number;
  /** Rows matching the filters, across all pages. */
  readonly total: number;
  /** Plural noun for the summary, e.g. "events". */
  readonly itemLabel: string;
  readonly hasNewer: boolean;
  readonly hasOlder: boolean;
  readonly onNewer: () => void;
  readonly onOlder: () => void;
  /** Jump back to the newest page. */
  readonly onLatest: () => void;
  readonly pageSize: number;
  readonly pageSizeOptions: readonly number[];
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly isLoading?: boolean;
}

/**
 * Pagination for append-only lists served with keyset cursors (audit log).
 * There are no page numbers: the list moves "Older" / "Newer", which stays
 * correct and fast while new rows keep arriving.
 */
export function CursorPagination({
  shown,
  total,
  itemLabel,
  hasNewer,
  hasOlder,
  onNewer,
  onOlder,
  onLatest,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  isLoading = false,
}: CursorPaginationProps) {
  const { t } = useAdmin();
  if (total <= 0) return null;

  return (
    <nav
      aria-label={t.content.pagination}
      aria-busy={isLoading}
      className="flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-4 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-medium text-slate-600 dark:text-slate-400" aria-live="polite">
          {t.content.showing} {shown} {t.content.of} {total} {itemLabel}
        </span>
        <label className="flex items-center gap-2">
          <span>{t.content.perPage}</span>
          <NativeSelect
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number.parseInt(value, 10))}
            options={pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }))}
            aria-label={t.content.perPage}
            className="min-h-0 w-auto gap-1.5 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
          />
        </label>
      </div>

      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <button
          type="button"
          className={BUTTON}
          disabled={!hasNewer || isLoading}
          onClick={onLatest}
        >
          {t.content.latest}
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={!hasNewer || isLoading}
          onClick={onNewer}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t.content.newer}
        </button>
        <button
          type="button"
          className={BUTTON}
          disabled={!hasOlder || isLoading}
          onClick={onOlder}
        >
          {t.content.older}
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}
