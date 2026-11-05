'use client';

import React from 'react';
import { Eye, Users, Clock, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { AnalyticsSummary } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface AnalyticsMetricsCardsProps {
  summary: AnalyticsSummary;
  isLoading?: boolean;
}

export function AnalyticsMetricsCards({ summary, isLoading }: AnalyticsMetricsCardsProps) {
  const { t } = useAdmin();

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const cards = [
    {
      title: t('analytics.totalPageViews'),
      value: summary.totalPageViews.toLocaleString(),
      growth: summary.pageViewsGrowth,
      icon: Eye,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      sparklineColor: '#10b981',
      sparklinePath: 'M0,25 Q20,10 40,20 T80,8 T120,2 T160,12',
    },
    {
      title: t('analytics.uniqueVisitors'),
      value: summary.uniqueVisitors.toLocaleString(),
      growth: summary.visitorsGrowth,
      icon: Users,
      iconBg: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
      sparklineColor: '#0ea5e9',
      sparklinePath: 'M0,22 Q25,18 50,8 T100,16 T140,5 T160,8',
    },
    {
      title: t('analytics.avgDuration'),
      value: formatDuration(summary.avgDurationSeconds),
      growth: summary.durationGrowth,
      icon: Clock,
      iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
      sparklineColor: '#8b5cf6',
      sparklinePath: 'M0,18 Q30,5 60,15 T110,22 T140,6 T160,4',
    },
    {
      title: t('analytics.bounceRate'),
      value: `${summary.bounceRate}%`,
      growth: summary.bounceRateGrowth,
      isBounce: true,
      icon: Activity,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      sparklineColor: '#f59e0b',
      sparklinePath: 'M0,8 Q20,18 45,12 T90,22 T130,16 T160,24',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        // For bounce rate, negative growth is good (green), positive is bad
        const isPositive = card.isBounce ? card.growth <= 0 : card.growth >= 0;
        const GrowthIcon = card.growth >= 0 ? TrendingUp : TrendingDown;
        const absGrowth = Math.abs(card.growth);

        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md"
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <Icon className="size-4" />
              </div>
            </div>

            {/* Value and growth row */}
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {isLoading ? '...' : card.value}
              </span>

              <div
                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400'
                }`}
              >
                <GrowthIcon className="size-3" />
                <span>{absGrowth}%</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {t('analytics.vsPreviousPeriod')}
              </span>
              <svg className="w-20 h-6 overflow-visible" viewBox="0 0 160 30" fill="none">
                <path
                  d={card.sparklinePath}
                  stroke={card.sparklineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
