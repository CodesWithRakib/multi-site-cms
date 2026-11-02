'use client';

import React, { useState } from 'react';
import { BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useListSitesQuery,
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsRealtimeQuery,
} from '@/lib/cms-api';
import type { AnalyticsTimeframe } from '@multi-site-cms/types';
import {
  AnalyticsFilterBar,
  AnalyticsMetricsCards,
  AnalyticsTimeChart,
  RealtimeTrafficWidget,
  TopPagesTable,
  TrafficSourcesCard,
  DeviceAndBrowserCard,
  CountryDemographicsCard,
} from '@/features/analytics';

export default function AnalyticsPage() {
  const { t, isSuperAdmin } = useAdmin();

  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<AnalyticsTimeframe>('30d');

  // Fetch sites for site selector
  const { data: sitesData } = useListSitesQuery();
  const sites = sitesData || [];

  // Fetch aggregated & time-series analytics
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    refetch: refetchOverview,
  } = useGetAnalyticsOverviewQuery({
    siteId: selectedSiteId || undefined,
    timeframe: selectedTimeframe,
  });

  // Fetch realtime 30-minute pulse with polling
  const {
    data: realtimeData,
    isLoading: isRealtimeLoading,
    refetch: refetchRealtime,
  } = useGetAnalyticsRealtimeQuery(
    { siteId: selectedSiteId || undefined },
    { pollingInterval: 10000 },
  );

  const handleRefresh = () => {
    refetchOverview();
    refetchRealtime();
  };

  const handleExport = () => {
    if (!overviewData) return;
    const jsonContent = JSON.stringify(overviewData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedSiteId || 'all-sites'}-${selectedTimeframe}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const emptySummary = {
    totalPageViews: 0,
    pageViewsGrowth: 0,
    uniqueVisitors: 0,
    visitorsGrowth: 0,
    avgDurationSeconds: 0,
    durationGrowth: 0,
    bounceRate: 0,
    bounceRateGrowth: 0,
  };

  const summary = overviewData?.summary || emptySummary;
  const timeseries = overviewData?.timeseries || [];
  const topPages = overviewData?.topPages || [];
  const sources = overviewData?.trafficSources || [];
  const devices = overviewData?.deviceBreakdown || [];
  const browsers = overviewData?.browserBreakdown || [];
  const countries = overviewData?.countryBreakdown || [];

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                <BarChart3 className="size-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                {t('analytics.title')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                <ShieldCheck className="size-3" />
                <span>RBAC Scoped</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              {t('analytics.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs">
              <Sparkles className="size-3.5 text-emerald-500" />
              <span>Multi-Site Telemetry</span>
            </span>
          </div>
        </div>

        {/* Filter and Timeframe Toolbar */}
        <AnalyticsFilterBar
          selectedSiteId={selectedSiteId}
          onSiteChange={setSelectedSiteId}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
          sites={sites}
          isRefreshing={isOverviewFetching}
          onRefresh={handleRefresh}
          onExport={handleExport}
          isSuperAdmin={isSuperAdmin}
        />

        {/* 4 Key Performance Metrics Cards */}
        <AnalyticsMetricsCards
          summary={summary}
          isLoading={isOverviewLoading}
        />

        {/* Middle Section: Timeseries Area Chart (8 cols) & Real-time Live Pulse (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <AnalyticsTimeChart
              data={timeseries}
              isLoading={isOverviewLoading}
            />
          </div>

          <div className="lg:col-span-4">
            <RealtimeTrafficWidget
              realtimeData={realtimeData}
              isLoading={isRealtimeLoading}
            />
          </div>
        </div>

        {/* Top Performing Articles & Pages Table */}
        <TopPagesTable
          pages={topPages}
          isLoading={isOverviewLoading}
        />

        {/* Bottom Section: Traffic Acquisition, Device/Browser Breakdown, and Geographic Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TrafficSourcesCard
            sources={sources}
            isLoading={isOverviewLoading}
          />

          <DeviceAndBrowserCard
            devices={devices}
            browsers={browsers}
            isLoading={isOverviewLoading}
          />

          <CountryDemographicsCard
            countries={countries}
            isLoading={isOverviewLoading}
          />
        </div>
      </div>
    </ShellLayout>
  );
}

