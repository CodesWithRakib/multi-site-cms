'use client';

import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

import type { WorkspaceNotice } from '../hooks/usePostsWorkspace';

const AUTO_DISMISS_MS = 6000;

/**
 * Result of a workspace action (replaces native `alert()`). Errors use
 * role="alert" so screen readers announce them at once; successes are polite
 * and dismiss themselves.
 */
export function WorkspaceNoticeBanner({
  notice,
  onDismiss,
}: {
  readonly notice: WorkspaceNotice | null;
  readonly onDismiss: () => void;
}) {
  useEffect(() => {
    if (notice?.tone !== 'success') return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice, onDismiss]);

  if (!notice) return null;
  const isError = notice.tone === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isError
          ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
      }`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{notice.text}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        aria-label="Dismiss message"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
