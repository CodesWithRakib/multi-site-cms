'use client';

import React from 'react';
import { Radio, Monitor, Smartphone, Tablet } from 'lucide-react';
import type { AnalyticsRealtimeData } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface RealtimeTrafficWidgetProps {
  realtimeData?: AnalyticsRealtimeData;
  isLoading?: boolean;
}

export function RealtimeTrafficWidget({ realtimeData, isLoading }: RealtimeTrafficWidgetProps) {
  const { t } = useAdmin();

  const activeVisitors = realtimeData?.activeVisitors30m ?? 0;
  const lastHourViews = realtimeData?.pageViewsLastHour ?? 0;
  const minutes = realtimeData?.recentViewsPerMinute ?? [];
  const events = realtimeData?.recentEvents ?? [];

  const maxMinuteViews = Math.max(...minutes.map((m) => m.views), 1);

  const renderDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="size-3.5 text-slate-400" />;
      case 'tablet':
        return <Tablet className="size-3.5 text-slate-400" />;
      default:
        return <Monitor className="size-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      {/* Top Header with Pulsing Live Status */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {t('analytics.realtimePulse')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.realtimeSubtitle')}
          </p>
        </div>

        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
          <Radio className="size-4" />
        </div>
      </div>

      {/* Main active counters */}
      <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : activeVisitors}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {t('analytics.activeReaders')}
          </div>
        </div>

        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {isLoading ? '...' : lastHourViews}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {t('analytics.viewsLastHour')}
          </div>
        </div>
      </div>

      {/* Minute by minute bar graph */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
          <span>-30 min</span>
          <span>Views / Min</span>
          <span>Now</span>
        </div>
        <div className="flex items-end gap-1 h-12 w-full pt-1">
          {minutes.map((m, idx) => {
            const heightPercent = Math.max((m.views / maxMinuteViews) * 100, 8);
            return (
              <div
                key={idx}
                title={`${m.minute}: ${m.views} views`}
                className="flex-1 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-xs transition-all cursor-pointer"
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Live recent events feed */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
          {t('analytics.recentLiveEvents')}
        </h4>

        {events.length === 0 ? (
          <div className="text-xs text-slate-400 py-3 text-center">
            {t('analytics.noData')}
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 4).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
              >
                <div className="flex items-center gap-2 truncate">
                  {renderDeviceIcon(event.deviceType)}
                  <div className="truncate">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {event.title || event.path}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {event.siteName} • {event.countryName}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap pl-2">
                  live
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

