'use client';

import { Calendar, CheckCircle2, Clock, FileText } from 'lucide-react';

import { DashboardMetricItem } from '@/features/dashboard/components/dashboard-metric-item';
import { useAdmin } from '@/lib/admin-context';

import type { PostsStats } from '../hooks/usePostsWorkspace';

interface PostsStatsCardsProps {
  readonly stats: PostsStats;
  readonly isLoading: boolean;
}

/**
 * Real counts only. The previous cards showed a fake "+total" trend and
 * decorative sparklines that implied growth regardless of the data.
 */
export function PostsStatsCards({ stats, isLoading }: PostsStatsCardsProps) {
  const { t } = useAdmin();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <DashboardMetricItem
        label={t.content.totalPosts || 'Total Posts'}
        value={stats.total}
        icon={FileText}
        iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.status.published}
        value={stats.published}
        icon={CheckCircle2}
        iconGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.status.draft}
        value={stats.drafts}
        subtext={`${t.status.in_review}: ${stats.inReview}`}
        icon={Clock}
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.status.scheduled}
        value={stats.scheduled}
        icon={Calendar}
        iconGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        isLoading={isLoading}
      />
    </div>
  );
}
