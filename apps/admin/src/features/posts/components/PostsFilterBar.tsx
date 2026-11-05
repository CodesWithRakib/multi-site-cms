'use client';

import { Search, X } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';

const SELECT_CLASS =
  'w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-pointer';

const CONTENT_TYPES = [
  { value: 'travel_guide', label: 'Travel Guide' },
  { value: 'air_sports_update', label: 'Air Sports Update' },
  { value: 'article', label: 'Article' },
  { value: 'news', label: 'Breaking News' },
  { value: 'event_update', label: 'Event Update' },
] as const;

interface PostsFilterBarProps {
  readonly sites: SiteItem[];
  readonly searchTerm: string;
  readonly typeFilter: string;
  readonly hasActiveFilters: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onTypeChange: (value: string) => void;
  readonly onSiteChange: (siteId: string | null) => void;
  readonly onClear: () => void;
}

export function PostsFilterBar({
  sites,
  searchTerm,
  typeFilter,
  hasActiveFilters,
  onSearchChange,
  onTypeChange,
  onSiteChange,
  onClear,
}: PostsFilterBarProps) {
  const { t, activeSiteId } = useAdmin();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
      <div className="relative flex-1 min-w-[240px]">
        <Search
          className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.actions.search || 'Search posts...'}
          aria-label={t.actions.search || 'Search posts'}
          className="w-full h-10 pl-10 pr-9 text-xs rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="w-48">
        <select
          aria-label="Filter by content type"
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">{t.content.filterByType || 'All Types'}</option>
          {CONTENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-48">
        <select
          aria-label="Filter by website"
          value={activeSiteId || ''}
          onChange={(e) => onSiteChange(e.target.value || null)}
          className={SELECT_CLASS}
        >
          <option value="">{t.content.filterBySite || 'All Websites'}</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
        >
          <X className="size-3.5" aria-hidden="true" />
          <span>{t.actions.clearFilters || 'Clear Filters'}</span>
        </button>
      )}
    </div>
  );
}
