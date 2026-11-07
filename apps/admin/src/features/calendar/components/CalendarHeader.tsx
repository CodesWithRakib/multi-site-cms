'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';
import type { CalendarViewMode } from '../types';

const FILTER_SELECT_CLASS =
  'w-auto px-2.5 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-emerald-500 font-medium';

const TYPE_OPTIONS: NativeSelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'travel_guide', label: 'Travel Guide' },
  { value: 'air_sports_update', label: 'Air Sports Update' },
  { value: 'article', label: 'Article' },
];

const STATUS_OPTIONS: NativeSelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'scheduled', label: 'Scheduled Only' },
  { value: 'published', label: 'Published Only' },
  { value: 'draft', label: 'Drafts Only' },
];
import { PublishingHealthBadge } from './PublishingHealthBadge';
import type { SiteItem } from '@multi-site-cms/types';

interface CalendarHeaderProps {
  monthName: string;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  activeSite: SiteItem | null;
  availableSites: SiteItem[];
  selectedSiteId: string;
  onSiteChange: (siteId: string) => void;
  typeFilter: string;
  onTypeFilterChange: (type: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onScheduleClick: () => void;
  timezone: string;
}

export function CalendarHeader({
  monthName,
  viewMode,
  onViewModeChange,
  onPrevMonth,
  onNextMonth,
  onToday,
  activeSite,
  availableSites,
  selectedSiteId,
  onSiteChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onScheduleClick,
  timezone,
}: CalendarHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top row: Title, status badge, action button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 font-sans">
              <CalendarIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
              Publishing Calendar
            </h1>
            {activeSite ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{activeSite.name}</span>
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                All Sites
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Timeline schedule of editorial publications and cross-site releases. (Timezone:{' '}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {timezone}
            </span>
            )
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PublishingHealthBadge />
          <button
            type="button"
            onClick={onScheduleClick}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Schedule Post</span>
          </button>
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Month navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 min-w-[150px]">
            {monthName}
          </h2>

          <button
            type="button"
            onClick={onToday}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View mode toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Site Filter */}
          <NativeSelect
            aria-label="Filter by website"
            value={selectedSiteId}
            onValueChange={onSiteChange}
            options={[
              { value: '', label: 'All Publications Sites' },
              ...availableSites.map((site) => ({ value: site.id, label: site.name })),
            ]}
            className={FILTER_SELECT_CLASS}
          />

          {/* Type Filter */}
          <NativeSelect
            aria-label="Filter by content type"
            value={typeFilter}
            onValueChange={onTypeFilterChange}
            options={TYPE_OPTIONS}
            className={FILTER_SELECT_CLASS}
          />

          {/* Status Filter */}
          <NativeSelect
            aria-label="Filter by status"
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            options={STATUS_OPTIONS}
            className={FILTER_SELECT_CLASS}
          />

          {/* View Mode Toggle */}
          <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onViewModeChange('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
