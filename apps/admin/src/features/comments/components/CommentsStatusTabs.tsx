'use client';

import React from 'react';
import type { AdminCommentsCounts } from '@multi-site-cms/types';

interface CommentsStatusTabsProps {
  activeStatus: string;
  counts: AdminCommentsCounts;
  onStatusChange: (status: string) => void;
}

export function CommentsStatusTabs({
  activeStatus,
  counts,
  onStatusChange,
}: CommentsStatusTabsProps) {
  const tabs = [
    {
      key: 'all',
      label: 'All Comments',
      count: counts.all,
      color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    {
      key: 'pending',
      label: 'Pending',
      count: counts.pending,
      color:
        'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30',
      highlightBadge: counts.pending > 0,
    },
    {
      key: 'approved',
      label: 'Approved',
      count: counts.approved,
      color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300',
    },
    {
      key: 'spam',
      label: 'Spam',
      count: counts.spam,
      color: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      count: counts.rejected,
      color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              isActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive ? 'bg-white/20 text-white' : tab.color
              }`}
            >
              {tab.highlightBadge && (
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
