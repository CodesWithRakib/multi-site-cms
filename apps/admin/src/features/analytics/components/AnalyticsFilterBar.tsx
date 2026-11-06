'use client';

import React from 'react';
import { Calendar, Globe, RefreshCw, Download } from 'lucide-react';
import type { AnalyticsTimeframe } from '@multi-site-cms/types';
import { NativeSelect } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

export interface AnalyticsFilterBarProps {
  selectedSiteId: string;
  onSiteChange: (siteId: string) => void;
  selectedTimeframe: AnalyticsTimeframe;
  onTimeframeChange: (timeframe: AnalyticsTimeframe) => void;
  sites: Array<{ id: string; name: string; key: string }>;
  isRefreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  isSuperAdmin: boolean;
}

export function AnalyticsFilterBar({
  selectedSiteId,
  onSiteChange,
  selectedTimeframe,
  onTimeframeChange,
  sites,
  isRefreshing,
  onRefresh,
  onExport,
  isSuperAdmin,
}: AnalyticsFilterBarProps) {
  const { t } = useAdmin();

  const timeframes: Array<{ key: AnalyticsTimeframe; label: string }> = [
    { key: '7d', label: '7D' },
    { key: '14d', label: '14D' },
    { key: '30d', label: '30D' },
    { key: '90d', label: '90D' },
    { key: '1y', label: '1Y' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Site selector (for Super Admin) */}
      <div className="flex flex-wrap items-center gap-3">
        {isSuperAdmin && (
          <div className="relative min-w-[200px]">
            <Globe
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 size-4 text-emerald-600 dark:text-emerald-400"
            />
            <NativeSelect
              aria-label="Filter analytics by website"
              value={selectedSiteId}
              onValueChange={onSiteChange}
              options={[
                { value: '', label: t('analytics.allWebsites') },
                ...sites.map((site) => ({ value: site.id, label: site.name })),
              ]}
              className="pl-9 pr-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-emerald-500/30"
            />
          </div>
        )}

        {/* Timeframe pill selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
          <Calendar className="size-3.5 text-slate-500 dark:text-slate-400 mx-2" />
          {timeframes.map(({ key, label }) => {
            const isActive = selectedTimeframe === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTimeframeChange(key)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons (Export & Refresh) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Export CSV / JSON report"
        >
          <Download className="size-3.5 text-slate-500 dark:text-slate-400" />
          <span>{t('analytics.exportReport')}</span>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="Refresh metrics"
        >
          <RefreshCw
            className={`size-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}
