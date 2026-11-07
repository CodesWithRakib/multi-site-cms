'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';

interface MediaFilterBarProps {
  activeSiteId: string | null;
  availableSites: SiteItem[];
  onSiteChange: (siteId: string | null) => void;
  mimeFilter: string;
  onMimeFilterChange: (mime: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function MediaFilterBar({
  activeSiteId,
  availableSites,
  onSiteChange,
  mimeFilter,
  onMimeFilterChange,
  searchTerm,
  onSearchChange,
}: MediaFilterBarProps) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Multi-Tenant Switcher Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            Scope:
          </span>

          <button
            type="button"
            onClick={() => onSiteChange(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !activeSiteId
                ? 'bg-brand-900 dark:bg-slate-800 text-white shadow-xs ring-1 ring-brand-400/30'
                : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Sites
          </button>

          {availableSites.map((site) => {
            const isActive = activeSiteId === site.id;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => onSiteChange(site.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-brand-900 dark:bg-slate-800 text-white shadow-xs ring-1 ring-brand-400/30'
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {site.name}
              </button>
            );
          })}
        </div>

        {/* Format Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {[
            { label: 'All Formats', value: '' },
            { label: 'Images', value: 'image/' },
            { label: 'Documents', value: 'application/pdf' },
            { label: 'Videos', value: 'video/' },
          ].map((fmt) => (
            <button
              key={fmt.value}
              type="button"
              onClick={() => onMimeFilterChange(fmt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                mimeFilter === fmt.value
                  ? 'bg-white dark:bg-slate-900 text-brand-950 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search media by filename, alt text, or caption..."
          className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
