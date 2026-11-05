'use client';

import { Shield, ShieldCheck, UserX, Users } from 'lucide-react';
import type { UserStats } from '@multi-site-cms/types';

import { DashboardMetricItem } from '@/features/dashboard/components/dashboard-metric-item';
import { useAdmin } from '@/lib/admin-context';

export interface UserStatsCardsProps {
  readonly stats: UserStats | undefined;
  readonly isLoading: boolean;
}

/**
 * Counts from `GET /users/stats` (all users, not one page). Replaces a card
 * for "Editors & Authors", roles that do not exist on the platform.
 */
export function UserStatsCards({ stats, isLoading }: UserStatsCardsProps) {
  const { t } = useAdmin();
  const inactive = (stats?.byStatus.suspended ?? 0) + (stats?.byStatus.disabled ?? 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
      <DashboardMetricItem
        label={t.users.totalUsers || 'Total users'}
        value={stats?.total ?? 0}
        subtext={`${stats?.byStatus.active ?? 0} active`}
        icon={Users}
        iconGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.users.superAdmins || 'Super Admins'}
        value={stats?.superAdmins ?? 0}
        subtext={`${stats?.activeSuperAdmins ?? 0} active`}
        icon={ShieldCheck}
        iconGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label={t.users.siteAdmins || 'Site Admins'}
        value={stats?.siteAdmins ?? 0}
        subtext="Scoped to one or more sites"
        icon={Shield}
        iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        isLoading={isLoading}
      />
      <DashboardMetricItem
        label="Inactive"
        value={inactive}
        subtext={`${stats?.byStatus.invited ?? 0} invited`}
        icon={UserX}
        iconGradient="bg-gradient-to-br from-amber-400 to-orange-500"
        isLoading={isLoading}
      />
    </div>
  );
}
