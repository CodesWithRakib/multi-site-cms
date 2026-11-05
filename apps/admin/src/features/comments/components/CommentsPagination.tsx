'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CommentsPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export function CommentsPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: CommentsPaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-foreground">{start}</span> to{' '}
          <span className="font-semibold text-foreground">{end}</span> of{' '}
          <span className="font-semibold text-foreground">{total}</span> results
        </span>

        <span className="text-border">|</span>

        <label htmlFor="comments-limit" className="text-xs">
          Per page:
        </label>
        <select
          id="comments-limit"
          value={limit}
          onChange={(e) => onLimitChange(Number.parseInt(e.target.value, 10))}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 font-medium text-foreground">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
