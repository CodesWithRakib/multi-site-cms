'use client';

import { CheckCircle2, FileText, Globe, Radio } from 'lucide-react';

import { DashboardMetricItem } from '@/features/dashboard/components/dashboard-metric-item';
import { useAdmin } from '@/lib/admin-context';

import type { SitesRegistryStats } from '../utils/sites-registry';

interface SitesStatsCardsProps {
  readonly stats: SitesRegistryStats;
  readonly publishedPosts: number;
  readonly isLoading: boolean;
}

/**
 * Real counts only. Replaces cards that showed decorative sparklines, a fake
 * "Active ↑" trend, a fallback of 10 posts, and a hardcoded "100% Operational".
 */
export function SitesStatsCards({ stats, publishedPosts, isLoading }: SitesStatsCardsProps) {
  const { t } = useAdmin();
  const pending = stats.domains - stats.verifiedDomains;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <DashboardMetricItem
        label={t.nav.websites || 'Websites'}
        value={stats.total}
        subtext={`${stats.byStatus.active} active`}
        icon={Globe}
        iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.sites.activeDomains || 'Domains'}
        value={stats.domains}
        subtext={`${stats.verifiedDomains} verified`}
        icon={Radio}
        iconGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label="Pending DNS"
        value={pending}
        subtext={pending === 0 ? 'All domains verified' : 'Awaiting verification'}
        icon={CheckCircle2}
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.sites.publishedArticles || 'Published posts'}
        value={publishedPosts}
        subtext="Across all sites"
        icon={FileText}
        iconGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        isLoading={isLoading}
      />
    </div>
  );
}
