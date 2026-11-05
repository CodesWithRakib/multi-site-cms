'use client';

import React from 'react';
import type { AnalyticsCountryItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface CountryDemographicsCardProps {
  countries: AnalyticsCountryItem[];
  isLoading?: boolean;
}

export function CountryDemographicsCard({
  countries,
  isLoading,
}: CountryDemographicsCardProps) {
  const { t } = useAdmin();

  // Helper to convert 2-letter ISO code to flag emoji
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {t('analytics.geographicDistribution')}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('analytics.geoSubtitle')}
        </p>
      </div>

      <div className="space-y-3.5 my-auto">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin inline-block mr-2" />
            Loading countries...
          </div>
        ) : countries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('analytics.noData')}
          </div>
        ) : (
          countries.slice(0, 6).map((c) => (
            <div key={c.countryCode} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none select-none">
                    {getFlagEmoji(c.countryCode)}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {c.countryName}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                  <span className="text-slate-900 dark:text-slate-100">
                    {c.count.toLocaleString()}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    ({c.percentage}%)
                  </span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${c.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

