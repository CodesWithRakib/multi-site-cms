'use client';

import React from 'react';
import { Search, RotateCw, FileSpreadsheet, FileJson, X } from 'lucide-react';
import type { AuditLogCategory, SiteItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface AuditLogFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: AuditLogCategory;
  onCategoryChange: (cat: AuditLogCategory) => void;
  selectedSiteId?: string;
  onSiteChange: (siteId?: string) => void;
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

  return (
    <div className="flex flex-col gap-3.5 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-xs">
      {/* Top Row: Search + Site Filter + Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
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

        {/* Site Selector + Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedSiteId ?? ''}
            onChange={(e) => onSiteChange(e.target.value || undefined)}
            className="px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            <option value="">{t('auditLogs.allWebsites')}</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title={t('auditLogs.refresh')}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('auditLogs.refresh')}</span>
          </button>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors cursor-pointer"
              title={t('auditLogs.exportCsv')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('auditLogs.exportCsv')}</span>
            </button>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors cursor-pointer"
              title={t('auditLogs.exportJson')}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 border-t border-neutral-100 dark:border-neutral-800 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
