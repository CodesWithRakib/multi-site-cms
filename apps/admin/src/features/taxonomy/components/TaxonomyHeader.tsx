'use client';

import React from 'react';
import { Layers, Plus, RefreshCw, Search, X } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';
import { NativeSelect } from '@multi-site-cms/ui';
import type { TaxonomyTab } from '../types';

interface TaxonomyHeaderProps {
  title: string;
  subtitle: string;
  currentSiteName: string;
  availableSites: SiteItem[];
  effectiveSiteId: string | null;
  onSiteChange: (siteId: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  activeTab: TaxonomyTab;
  isFetching: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
}

export function TaxonomyHeader({
  title,
  subtitle,
  currentSiteName,
  availableSites,
  effectiveSiteId,
  onSiteChange,
  searchTerm,
  onSearchChange,
  activeTab,
  isFetching,
  onRefresh,
  onOpenCreate,
}: TaxonomyHeaderProps) {
  return (
    <div className="space-y-4">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 font-sans">
              <Layers className="size-6 text-emerald-600 dark:text-emerald-400" />
              {title}
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{currentSiteName}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Taxonomy"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
            />
          </button>

          {/* Mint CTA Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            disabled={!effectiveSiteId}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 hover:from-brand-500 hover:to-brand-400 text-brand-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>{activeTab === 'categories' ? 'New Category' : 'New Tag'}</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Toolbar: Site Selector & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Site Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="taxonomy-site-scope"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0"
          >
            Site Scope:
          </label>
          <NativeSelect
            id="taxonomy-site-scope"
            value={effectiveSiteId || ''}
            onValueChange={onSiteChange}
            options={availableSites.map((site) => ({ value: site.id, label: site.name }))}
            className="w-auto px-3 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Filter ${activeTab}...`}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
