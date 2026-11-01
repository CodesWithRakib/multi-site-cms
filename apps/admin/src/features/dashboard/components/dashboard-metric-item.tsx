'use client';

import React from 'react';
import { ArrowUp, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@multi-site-cms/ui';

export interface DashboardMetricItemProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: LucideIcon;
  iconGradient?: string;
  sparklineColor?: string;
  iconColorClass?: string;
  isLoading?: boolean;
}

export function DashboardMetricItem({
  label,
  value,
  subtext,
  trend = '12.5%',
  icon: Icon,
  iconGradient = 'bg-gradient-to-br from-emerald-400 to-teal-500',
  sparklineColor = '#10b981',
  isLoading = false,
}: DashboardMetricItemProps) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
      <div className="flex items-center gap-4">
        {/* Rounded square gradient icon */}
        <div
          className={`size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${iconGradient}`}
        >
          <Icon className="size-6" />
        </div>

        {/* Value and label */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {label}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                {value}
              </span>
            )}
            <div className="flex items-center text-emerald-500 text-xs font-semibold gap-0.5">
              <ArrowUp className="size-3 stroke-[2.5]" />
              <span>{trend}</span>
            </div>
          </div>
          {subtext && <span className="sr-only">{subtext}</span>}
        </div>
      </div>

      {/* Decorative smooth wavy sparkline SVG on right */}
      <div className="hidden sm:block w-20 h-10 shrink-0">
        <svg viewBox="0 0 80 40" className="w-full h-full overflow-visible" fill="none">
          <path
            d="M 2 28 C 15 28, 20 12, 32 18 C 42 24, 52 8, 62 14 C 70 19, 75 10, 78 6"
            stroke={sparklineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
