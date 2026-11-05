'use client';

import React from 'react';
import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@multi-site-cms/ui';

export interface DashboardMetricItemProps {
  label: string;
  value: string | number;
  subtext?: string;
  /** Real change only, e.g. "+12.9%". Omit when no comparison exists: no badge is shown. */
  trend?: string;
  icon: LucideIcon;
  iconGradient?: string;
  isLoading?: boolean;
}

/**
 * One headline number. It never invents a trend or a sparkline: both used to
 * be decorative defaults that suggested growth regardless of the data.
 */
export function DashboardMetricItem({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  iconGradient = 'bg-gradient-to-br from-emerald-400 to-teal-500',
  isLoading = false,
}: DashboardMetricItemProps) {
  const isDown = trend?.trim().startsWith('-') ?? false;
  const TrendIcon = isDown ? ArrowDown : ArrowUp;

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex items-center gap-3 sm:gap-4 transition-all hover:shadow-sm min-w-0">
      <div
        className={`size-10 sm:size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${iconGradient}`}
      >
        <Icon className="size-5 sm:size-6" aria-hidden="true" />
      </div>

      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2 mt-0.5">
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              {value}
            </span>
          )}
          {trend && !isLoading && (
            <span
              className={`flex items-center text-xs font-semibold gap-0.5 ${
                isDown ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              <TrendIcon className="size-3 stroke-[2.5]" aria-hidden="true" />
              <span>{trend}</span>
            </span>
          )}
        </div>
        {subtext && (
          <span className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
