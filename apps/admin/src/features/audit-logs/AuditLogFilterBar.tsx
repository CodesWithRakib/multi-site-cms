'use client';

import React from 'react';
import {
  Search,
  RotateCw,
  FileSpreadsheet,
  FileJson,
  X,
  Radio,
  LayoutList,
  GitCommitHorizontal,
} from 'lucide-react';
import type { AuditLogCategory, SiteItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface AuditLogFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: AuditLogCategory;
  onCategoryChange: (cat: AuditLogCategory) => void;
  selectedSiteId?: string;
  onSiteChange: (siteId?: string) => void;
  selectedEntityType?: string;
  onEntityTypeChange: (entityType?: string) => void;
  selectedDatePreset: string;
  onDatePresetChange: (preset: string) => void;
  viewMode: 'table' | 'timeline';
  onViewModeChange: (mode: 'table' | 'timeline') => void;
  isLiveStream: boolean;
  onToggleLiveStream: () => void;
  sites: SiteItem[];
  onRefresh: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  isRefreshing: boolean;
}

export function AuditLogFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedSiteId,
  onSiteChange,
  selectedEntityType,
  onEntityTypeChange,
  selectedDatePreset,
  onDatePresetChange,
  viewMode,
  onViewModeChange,
  isLiveStream,
  onToggleLiveStream,
  sites,
  onRefresh,
  onExportCsv,
  onExportJson,
  isRefreshing,
}: AuditLogFilterBarProps) {
  const { t } = useAdmin();

  const categories: Array<{ id: AuditLogCategory; label: string }> = [
    { id: 'all', label: t('auditLogs.allCategories') },
    { id: 'auth', label: t('auditLogs.securityAuth') },
    { id: 'content', label: t('auditLogs.contentOps') },
    { id: 'media', label: t('auditLogs.mediaLibrary') },
    { id: 'user', label: t('auditLogs.userRoles') },
    { id: 'system', label: t('auditLogs.systemEvents') },
  ];

  const entityTypes = [
    { value: '', label: 'All Target Entities' },
    { value: 'post', label: 'Posts' },
    { value: 'post_publication', label: 'Publications' },
    { value: 'post_comment', label: 'Comments' },
    { value: 'media_asset', label: 'Media Assets' },
    { value: 'user', label: 'Users' },
    { value: 'user_role_assignment', label: 'Roles' },
    { value: 'site', label: 'Websites' },
    { value: 'newsletter_subscriber', label: 'Subscribers' },
    { value: 'platform_settings', label: 'System Settings' },
  ];

  const datePresets = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
  ];

  return (
    <div className="flex flex-col gap-3.5 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-xs">
      {/* Top Row: Search + Site + Entity + Date Preset Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('auditLogs.searchPlaceholder')}
            className="w-full pl-9 pr-8 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Site Selector */}
        <div>
          <select
            value={selectedSiteId ?? ''}
            onChange={(e) => onSiteChange(e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            <option value="">{t('auditLogs.allWebsites')}</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Entity Filter */}
        <div>
          <select
            value={selectedEntityType ?? ''}
            onChange={(e) => onEntityTypeChange(e.target.value || undefined)}
            className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            {entityTypes.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Preset Filter */}
        <div>
          <select
            value={selectedDatePreset}
            onChange={(e) => onDatePresetChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            {datePresets.map((dp) => (
              <option key={dp.value} value={dp.value}>
                {dp.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle/Bottom Row: Category Tabs + View Toggle + Live Stream + Export */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Controls: View Mode + Live Polling + Export */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {/* Table vs Timeline View Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('timeline')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <GitCommitHorizontal className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
          </div>

          {/* Live Stream Auto-Refresh Toggle */}
          <button
            type="button"
            onClick={onToggleLiveStream}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isLiveStream
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200'
            }`}
            title="Toggle Real-Time Activity Live Stream (Auto-polls every 15 seconds)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveStream ? 'bg-emerald-500 animate-ping' : 'bg-neutral-400'
              }`}
            />
            <Radio className="w-3.5 h-3.5" />
            <span>Live</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            title={t('auditLogs.refresh')}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV & JSON */}
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
            title={t('auditLogs.exportCsv')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer"
            title={t('auditLogs.exportJson')}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
}
