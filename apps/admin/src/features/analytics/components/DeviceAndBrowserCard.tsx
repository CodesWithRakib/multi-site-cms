'use client';

import React from 'react';
import { Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import type { AnalyticsBreakdownItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface DeviceAndBrowserCardProps {
  devices: AnalyticsBreakdownItem[];
  browsers: AnalyticsBreakdownItem[];
  isLoading?: boolean;
}

export function DeviceAndBrowserCard({ devices, browsers, isLoading }: DeviceAndBrowserCardProps) {
  const { t } = useAdmin();

  const getDeviceIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case 'tablet':
        return <Tablet className="size-4 text-sky-500" />;
      default:
        return <Monitor className="size-4 text-violet-500" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t('analytics.deviceBreakdown')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('analytics.deviceBreakdownSubtitle')}
        </p>
      </div>

      {/* Device Cards Row */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {devices.map((dev) => (
          <div
            key={dev.key}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center"
          >
            <div className="p-2 rounded-lg bg-white dark:bg-slate-700/80 shadow-2xs mb-2">
              {getDeviceIcon(dev.key)}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {dev.label}
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {dev.percentage}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {dev.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Browsers List */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Top Browsers</h4>

        {isLoading ? (
          <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Loading browsers...
          </div>
        ) : (
          <div className="space-y-2.5">
            {browsers.slice(0, 4).map((b) => (
              <div key={b.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                    <Globe className="size-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{b.label}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {b.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
