'use client';

import Link from 'next/link';
import { Plus, RefreshCw, X } from 'lucide-react';

import { useAdmin } from '@/lib/admin-context';

interface PostsWorkspaceHeaderProps {
  readonly isFetching: boolean;
  readonly onRefresh: () => void;
}

export function PostsWorkspaceHeader({ isFetching, onRefresh }: PostsWorkspaceHeaderProps) {
  const { t, activeSite, setActiveSiteId } = useAdmin();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            {t.content.title}
          </h1>
          {activeSite ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span
                className="size-2 rounded-full bg-emerald-500 animate-pulse"
                aria-hidden="true"
              />
              <span>{activeSite.name}</span>
              <button
                type="button"
                onClick={() => setActiveSiteId(null)}
                className="p-0.5 hover:text-rose-500 transition-colors"
                title="Clear site filter"
                aria-label="Clear site filter"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
              {t.dashboard.allSites || 'All Sites'}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.content.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onRefresh}
          className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          title="Refresh Posts"
          aria-label="Refresh Posts"
        >
          <RefreshCw
            className={`size-4 ${isFetching ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
            aria-hidden="true"
          />
        </button>

        <Link
          href="/posts/new"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 hover:from-brand-500 hover:to-brand-400 text-brand-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" aria-hidden="true" />
          <span>{t.content.newPost}</span>
        </Link>
      </div>
    </div>
  );
}
