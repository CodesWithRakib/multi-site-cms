'use client';

import React from 'react';
import { History, RotateCcw, X } from 'lucide-react';

export interface PostDraftRecoveryBannerProps {
  savedAt: string;
  onRestore: () => void;
  onDismiss: () => void;
}

export function PostDraftRecoveryBanner({
  savedAt,
  onRestore,
  onDismiss,
}: PostDraftRecoveryBannerProps) {
  const formattedTime = new Date(savedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/80 shadow-xs animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <History className="size-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
            Unsaved Local Draft Recovered
          </h4>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            A newer revision from this browser was backed up at {formattedTime}. Would you like to restore it?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <RotateCcw className="size-3.5" />
          <span>Restore Draft</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
          title="Dismiss and discard backup"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

