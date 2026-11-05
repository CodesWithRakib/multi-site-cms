'use client';

import { useAdmin } from '@/lib/admin-context';

const PAGE_BUTTON =
  'px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer';

export interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly total: number;
  readonly pageSize: number;
  /** Plural noun for the summary, e.g. "posts". */
  readonly itemLabel: string;
  readonly onPageChange: (page: number) => void;
}

/** Previous / next pagination with a "Showing a–b of n" summary. */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  const { t } = useAdmin();
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400"
    >
      <span className="font-medium text-slate-600 dark:text-slate-400">
        {t.content.showing || 'Showing'} {(page - 1) * pageSize + 1} -{' '}
        {Math.min(page * pageSize, total)} {t.content.of || 'of'} {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={PAGE_BUTTON}
        >
          {t.content.previous || 'Previous'}
        </button>
        <span
          aria-current="page"
          className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80"
        >
          {page}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className={PAGE_BUTTON}
        >
          {t.content.next || 'Next'}
        </button>
      </div>
    </nav>
  );
}
