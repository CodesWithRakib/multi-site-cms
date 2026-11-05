'use client';

import React from 'react';
import { RefreshCw, Grid, List, Layers, Upload, Globe } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';
import type { MediaViewMode, MediaTab } from '../types';

interface MediaHeaderProps {
  title: string;
  subtitle: string;
  activeSite: SiteItem | null;
  allSitesLabel: string;
  isFetching: boolean;
  onRefresh: () => void;
  viewMode: MediaViewMode;
  onViewModeChange: (mode: MediaViewMode) => void;
  activeTab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  browseLabel: string;
  uploadLabel: string;
}

export function MediaHeader({
  title,
  subtitle,
  activeSite,
  allSitesLabel,
  isFetching,
  onRefresh,
  viewMode,
  onViewModeChange,
  activeTab,
  onTabChange,
  browseLabel,
  uploadLabel,
}: MediaHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-1">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {activeSite ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-400/10 text-brand-400 border border-brand-400/20 shadow-xs">
              <span className="size-2 rounded-full bg-brand-400 animate-pulse" />
              {activeSite.name}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Globe className="size-3" />
              {allSitesLabel}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh media library"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${isFetching ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
          />
        </button>

        {/* View Mode Toggle (Grid / List) */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-brand-950 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="List View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-brand-950 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="size-4" />
          </button>
        </div>

        {/* Browse / Upload Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange('browse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'browse'
                ? 'bg-white dark:bg-slate-900 text-brand-950 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="size-3.5" />
            <span>{browseLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-brand-950 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="size-3.5" />
            <span>{uploadLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
