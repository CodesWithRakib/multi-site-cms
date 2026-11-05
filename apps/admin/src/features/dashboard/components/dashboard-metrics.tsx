'use client';

import React from 'react';
import { CheckCircle2, Eye, FileText, Globe } from 'lucide-react';
import type { DashboardMetrics as MetricsData } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';
import { DashboardMetricItem } from './dashboard-metric-item';

export interface PageViewsSummary {
  readonly total: number;
  /** Percent change versus the previous period of the same length. */
  readonly growth: number;
}

export interface DashboardMetricsProps {
  metrics?: MetricsData;
  isLoading: boolean;
  isPlatformView?: boolean;
  /** Real page views from the analytics API; omitted while loading or unavailable. */
  pageViews?: PageViewsSummary;
  isPageViewsLoading?: boolean;
}

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatGrowth(growth: number): string {
  const rounded = Math.round(growth * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}

/**
 * Headline numbers. Every value comes from an API response; nothing is
 * estimated, and a trend badge is shown only where a real change exists.
 */
export function DashboardMetrics({
  metrics,
  isLoading,
  pageViews,
  isPageViewsLoading = false,
}: DashboardMetricsProps) {
  const { availableSites, t } = useAdmin();

  const totalPosts = metrics?.totalContent ?? 0;
  const publishedCount = metrics?.publishedCount ?? 0;
  const draftsCount = metrics?.draftsCount ?? 0;
  const scheduledCount = metrics?.scheduledCount ?? 0;
  const activeSitesCount = metrics?.activeSitesCount ?? availableSites.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      {/* 1. Total Posts */}
      <DashboardMetricItem
        label={t('dashboard.totalPosts')}
        subtext={`Total Content: ${totalPosts}`}
        value={totalPosts}
        icon={FileText}
        iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        isLoading={isLoading}
      />

      {/* 2. Total Websites */}
      <DashboardMetricItem
        label={t('dashboard.totalWebsites')}
        subtext={`Active Sites: ${activeSitesCount}`}
        value={activeSitesCount}
        icon={Globe}
        iconGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        isLoading={isLoading}
      />

      {/* 3. Total Authors */}
      <DashboardMetricItem
        label={t('dashboard.publishedPosts')}
        subtext={`Drafts: ${draftsCount} · Scheduled: ${scheduledCount}`}
        value={publishedCount}
        icon={CheckCircle2}
        iconGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        isLoading={isLoading}
      />

      {/* 4. Total Views */}
      <DashboardMetricItem
        label={t('dashboard.totalViews')}
        subtext={pageViews ? t('dashboard.pageViewsSubtext') : t('dashboard.pageViewsUnavailable')}
        value={pageViews ? compactNumber.format(pageViews.total) : '—'}
        trend={pageViews ? formatGrowth(pageViews.growth) : undefined}
        icon={Eye}
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        isLoading={isLoading || isPageViewsLoading}
      />
    </div>
  );
}
