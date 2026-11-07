'use client';

import React from 'react';
import { CheckSquare, Trash2, X, Loader2 } from 'lucide-react';

export interface MediaBatchActionBarProps {
  selectedCount: number;
  totalOnPage: number;
  allSelectedOnPage: boolean;
  onSelectAllOnPage: (selected: boolean) => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  isDeleting?: boolean;
}

export function MediaBatchActionBar({
  selectedCount,
  totalOnPage,
  allSelectedOnPage,
  onSelectAllOnPage,
  onClearSelection,
  onDeleteSelected,
  isDeleting = false,
}: MediaBatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-auto max-w-xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 sm:gap-4 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-2xl border border-slate-700/70 backdrop-blur-md">
        {/* Selected badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80">
          <div className="size-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckSquare className="size-3.5" />
          </div>
          <span className="text-xs font-semibold whitespace-nowrap">{selectedCount} selected</span>
        </div>

        {/* Quick select/deselect page toggle */}
        <button
          type="button"
          onClick={() => onSelectAllOnPage(!allSelectedOnPage)}
          className="text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap hidden sm:inline-block"
        >
          {allSelectedOnPage ? 'Deselect page' : `Select page (${totalOnPage})`}
        </button>

        {/* Delete button */}
        <button
          type="button"
          disabled={isDeleting}
          onClick={onDeleteSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer shadow-sm shadow-red-900/40"
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          <span>Delete ({selectedCount})</span>
        </button>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Clear selection"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
