'use client';

import React from 'react';
import { Check, ShieldAlert, XCircle, Trash2, X } from 'lucide-react';
import type { CommentStatus } from '@multi-site-cms/types';

interface CommentsBatchActionsProps {
  selectedCount: number;
  isUpdating: boolean;
  onBatchStatus: (status: CommentStatus) => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}

export function CommentsBatchActions({
  selectedCount,
  isUpdating,
  onBatchStatus,
  onBatchDelete,
  onClearSelection,
}: CommentsBatchActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {selectedCount}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-foreground">
          {selectedCount} {selectedCount === 1 ? 'comment' : 'comments'} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Approve */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onBatchStatus('approved')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Approve All</span>
        </button>

        {/* Spam */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onBatchStatus('spam')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Mark Spam</span>
        </button>

        {/* Reject */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => onBatchStatus('rejected')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>Reject</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          disabled={isUpdating}
          onClick={onBatchDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-card hover:bg-red-50 dark:hover:bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
