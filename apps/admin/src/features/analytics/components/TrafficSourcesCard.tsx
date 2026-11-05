'use client';

import React from 'react';
import { Search, Compass, Share2, Mail, Link2 } from 'lucide-react';
import type { AnalyticsBreakdownItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface TrafficSourcesCardProps {
  sources: AnalyticsBreakdownItem[];
  isLoading?: boolean;
}

export function TrafficSourcesCard({ sources, isLoading }: TrafficSourcesCardProps) {
  const { t } = useAdmin();

  const getSourceIcon = (key: string) => {
    switch (key.toLowerCase()) {
      case 'search':
        return <Search className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case 'direct':
        return <Compass className="size-4 text-sky-500" />;
      case 'social':
        return <Share2 className="size-4 text-pink-500" />;
      case 'newsletter':
        return <Mail className="size-4 text-violet-500" />;
      default:
        return <Link2 className="size-4 text-amber-700 dark:text-amber-400" />;
    }
  };

  const getProgressColor = (key: string) => {
    switch (key.toLowerCase()) {
      case 'search':
        return 'bg-emerald-500';
      case 'direct':
        return 'bg-sky-500';
      case 'social':
        return 'bg-pink-500';
      case 'newsletter':
        return 'bg-violet-500';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t('analytics.trafficSources')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('analytics.trafficSourcesSubtitle')}
        </p>
      </div>

      <div className="space-y-4 my-auto">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin inline-block mr-2" />
            Loading sources...
          </div>
        ) : sources.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('analytics.noData')}
          </div>
        ) : (
          sources.map((src) => (
            <div key={src.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  {getSourceIcon(src.key)}
                  <span>{src.label}</span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-slate-900 dark:text-slate-100">
                    {src.count.toLocaleString()}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    ({src.percentage}%)
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                    src.key,
                  )}`}
                  style={{ width: `${src.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
