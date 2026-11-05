'use client';

import { useAdmin } from '@/lib/admin-context';

import type { PostsStats } from '../hooks/usePostsWorkspace';

interface PostsStatusTabsProps {
  readonly stats: PostsStats;
  readonly activeStatus: string;
  readonly onChange: (status: string) => void;
}

export function PostsStatusTabs({ stats, activeStatus, onChange }: PostsStatusTabsProps) {
  const { t } = useAdmin();
  const tabs = [
    { id: '', label: t.content.allPosts || 'All Posts', count: stats.total },
    { id: 'published', label: t.status.published, count: stats.published },
    { id: 'draft', label: t.status.draft, count: stats.drafts },
    { id: 'scheduled', label: t.status.scheduled, count: stats.scheduled },
    { id: 'in_review', label: t.status.in_review, count: stats.inReview },
    { id: 'archived', label: t.status.archived, count: stats.archived },
  ];

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="group"
      aria-label="Filter by status"
    >
      {tabs.map((tab) => {
        const isActive = activeStatus === tab.id;
        return (
          <button
            key={tab.id || 'all'}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-brand-400 text-brand-950 font-bold shadow-md shadow-brand-400/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-brand-950/15 text-brand-950'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
