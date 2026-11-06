'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { useGetAnalyticsOverviewQuery, useGetDashboardOverviewQuery } from '@/lib/cms-api';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardMetrics } from '@/features/dashboard/components/dashboard-metrics';
import { YourWebsites } from '@/features/dashboard/components/your-websites';
import { RecentActivity } from '@/features/dashboard/components/recent-activity';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { ContentActivityChart } from '@/features/dashboard/components/content-activity-chart';
import { SystemStatusCard } from '@/features/dashboard/components/system-status-card';

export default function AdminDashboardPage() {
  const { activeSiteId, isSuperAdmin } = useAdmin();
  const [days, setDays] = useState<number>(30);

  const {
    data: overview,
    isLoading,
    isFetching,
    refetch,
  } = useGetDashboardOverviewQuery({
    siteId: activeSiteId || undefined,
    days,
  });

  // Same site and period as the overview, so every number on the page agrees.
  const { data: analytics, isLoading: isAnalyticsLoading } = useGetAnalyticsOverviewQuery({
    siteId: activeSiteId || undefined,
    days,
  });
  const pageViews = analytics
    ? { total: analytics.summary.totalPageViews, growth: analytics.summary.pageViewsGrowth }
    : undefined;

  return (
    <ShellLayout>
      <div className="flex flex-col gap-6 w-full">
        {/* Welcome Greeting + Date Range Controls */}
        <DashboardHeader
          days={days}
          onDaysChange={setDays}
          onRefresh={refetch}
          isRefreshing={isFetching}
        />

        {/* 1. Dynamic Metrics Cards Row: 4 stat cards with gradient icons & sparklines */}
        <DashboardMetrics
          metrics={overview?.metrics}
          isLoading={isLoading}
          isPlatformView={!activeSiteId}
          pageViews={pageViews}
          isPageViewsLoading={isAnalyticsLoading}
        />

        {/* 2. Middle Row: Dynamic Websites (5 cols) | Real Activity Logs (4 cols) | Quick Actions (3 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5 flex flex-col">
            <YourWebsites sitePerformance={analytics?.sitePerformance} />
          </div>

          <div className="lg:col-span-4 flex flex-col">
            <RecentActivity items={overview?.recentActivity} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-3 flex flex-col">
            <QuickActions />
          </div>
        </div>

        {/* 3. Bottom Row: Dynamic Analytics Chart (7 cols) | Live System Health (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className={`flex flex-col ${isSuperAdmin ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <ContentActivityChart
              data={overview?.activitySeries}
              isLoading={isLoading}
              days={days}
              onDaysChange={setDays}
            />
          </div>

          {isSuperAdmin && (
            <div className="lg:col-span-5 flex flex-col">
              <SystemStatusCard />
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
