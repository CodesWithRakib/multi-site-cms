'use client';

import React from 'react';
import { Search, RotateCw, X, Globe } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';
import { useListSitesQuery } from '@/lib/cms-api';

interface CommentsFilterBarProps {
  search: string;
  selectedSiteId: string;
  isFetching: boolean;
  onSearchChange: (search: string) => void;
  onSiteChange: (siteId: string) => void;
  onRefresh: () => void;
}

export function CommentsFilterBar({
  search,
  selectedSiteId,
  isFetching,
  onSearchChange,
  onSiteChange,
  onRefresh,
}: CommentsFilterBarProps) {
  const { data: sitesData } = useListSitesQuery();
  const sites: SiteItem[] = sitesData ?? [];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by author, email, or content..."
          className="w-full rounded-xl border border-input bg-card pl-9.5 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Right controls: Site selector & Refresh */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1 sm:flex-initial min-w-[160px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
          </div>
          <select
            value={selectedSiteId}
            onChange={(e) => onSiteChange(e.target.value)}
            className="w-full rounded-xl border border-input bg-card pl-8.5 pr-8 py-2 text-xs sm:text-sm font-medium text-foreground transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="">All Websites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Refresh comments"
          title="Refresh"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>
    </div>
  );
}
