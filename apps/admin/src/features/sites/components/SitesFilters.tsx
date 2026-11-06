'use client';

import { Search, X } from 'lucide-react';
import type { SiteStatus } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';

import type { SitesRegistryStats } from '../utils/sites-registry';

interface SitesFiltersProps {
  readonly stats: SitesRegistryStats;
  readonly status: SiteStatus | '';
  readonly onStatusChange: (status: SiteStatus | '') => void;
  readonly search: string;
  readonly onSearchChange: (search: string) => void;
  readonly hasFilters: boolean;
  readonly onClear: () => void;
}

/** Status tabs with counts, and search by name, key, or hostname. */
export function SitesFilters({
  stats,
  status,
  onStatusChange,
  search,
  onSearchChange,
  hasFilters,
  onClear,
}: SitesFiltersProps) {
  const { t } = useAdmin();
  const tabs: ReadonlyArray<{ id: SiteStatus | ''; label: string; count: number }> = [
    { id: '', label: t.sites.allWebsites || 'All websites', count: stats.total },
    { id: 'active', label: t.status.active, count: stats.byStatus.active },
    { id: 'paused', label: t.status.paused, count: stats.byStatus.paused },
    { id: 'suspended', label: 'Suspended', count: stats.byStatus.suspended },
    { id: 'archived', label: t.status.archived, count: stats.byStatus.archived },
  ];

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"
        role="group"
        aria-label="Filter by status"
      >
        {tabs.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id || 'all'}
              type="button"
              aria-pressed={isActive}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search websites"
            placeholder={t.sites.searchPlaceholder || 'Search by name, key, or domain…'}
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 hover:underline font-semibold px-2 py-1 self-start md:self-auto cursor-pointer"
          >
            <X className="size-3.5" aria-hidden="true" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
