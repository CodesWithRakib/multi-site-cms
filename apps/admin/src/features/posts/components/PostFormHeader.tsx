'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, Loader2, Save, WifiOff, AlertTriangle } from 'lucide-react';
import type { AutosaveStatus } from '../hooks/useAutosave';

export interface PostFormHeaderProps {
  isCreateMode: boolean;
  currentRevisionNumber: number;
  lastSavedAt: Date | null;
  autosaveStatus: AutosaveStatus;
  isSubmitting: boolean;
  onOpenPreview: () => void;
  hasInitialPost: boolean;
  onSaveShortcut?: () => void;
}

export function PostFormHeader({
  isCreateMode,
  currentRevisionNumber,
  lastSavedAt,
  autosaveStatus,
  isSubmitting,
  onOpenPreview,
  hasInitialPost,
  onSaveShortcut,
}: PostFormHeaderProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-3">
        <Link
          href="/posts"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to Posts"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isCreateMode ? 'Create New Post' : 'Edit Post'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isCreateMode
              ? 'Draft will be auto-saved and backed up locally'
              : `Revision #${currentRevisionNumber} • Last saved: ${
                  lastSavedAt ? lastSavedAt.toLocaleTimeString() : 'Up to date'
                }`}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {!isCreateMode && (
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
            {autosaveStatus === 'saving' && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-slate-400">Saving...</span>
              </>
            )}
            {autosaveStatus === 'unsaved' && (
              <>
                <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">Unsaved</span>
              </>
            )}
            {autosaveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-slate-400">All changes saved</span>
              </>
            )}
            {autosaveStatus === 'failed' && (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-500 font-semibold">Save failed</span>
              </>
            )}
            {autosaveStatus === 'offline' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Offline</span>
              </>
            )}
          </div>
        )}

        {!isCreateMode && hasInitialPost && (
          <button
            type="button"
            onClick={onOpenPreview}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Preview</span>
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          onClick={onSaveShortcut}
          className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-brand-950 bg-gradient-to-r from-brand-400 to-brand-300 hover:brightness-105 active:scale-95 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : isCreateMode ? (
            <span>Create Post</span>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
