'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';
import { greetingName } from '../utils/greeting-name';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@multi-site-cms/ui';

export interface DashboardHeaderProps {
  days: number;
  onDaysChange: (days: number) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function DashboardHeader({ days, onDaysChange }: DashboardHeaderProps) {
  const { t, user } = useAdmin();
  const name = greetingName(user?.displayName);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
      {/* Welcome Greeting */}
      <div>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl select-none" role="img" aria-label="Waving hand">
            👋
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            {name ? `${t('dashboard.welcome')}, ${name}!` : `${t('dashboard.welcome')}!`}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('dashboard.welcomeSub')}
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={String(days)}
          onValueChange={(val) => onDaysChange(Number.parseInt(val, 10))}
        >
          <SelectTrigger
            className="h-10 px-4 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-2 min-w-[145px]"
            aria-label="Date Range Filter"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-3.5 text-slate-600 dark:text-slate-400" />
              <SelectValue placeholder={t('dashboard.last30Days')} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
            <SelectItem value="7" className="text-xs cursor-pointer">
              {t('dashboard.last7Days')}
            </SelectItem>
            <SelectItem value="14" className="text-xs cursor-pointer">
              {t('dashboard.last14Days')}
            </SelectItem>
            <SelectItem value="30" className="text-xs cursor-pointer">
              {t('dashboard.last30Days')}
            </SelectItem>
            <SelectItem value="90" className="text-xs cursor-pointer">
              {t('dashboard.last90Days')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
