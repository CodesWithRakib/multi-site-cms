'use client';

import React from 'react';
import { Users, ShieldCheck, Shield, UserCheck } from 'lucide-react';
import type { UserItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface UserStatsCardsProps {
  users: UserItem[];
}

export function UserStatsCards({ users }: UserStatsCardsProps) {
  const { t } = useAdmin();

  const stats = React.useMemo(() => {
    let superAdmins = 0;
    let siteAdmins = 0;
    let editorsAuthors = 0;
    let activeCount = 0;

    for (const u of users) {
      if (u.status === 'active') activeCount++;
      const isSuper = u.roles.some((r) => r.roleKey === 'super_admin' || r.scopeType === 'platform');
      const isSiteAdmin = u.roles.some((r) => r.roleKey === 'admin' || r.roleKey === 'site_admin');
      const isEditor = u.roles.some((r) => r.roleKey === 'site_editor' || r.roleKey === 'editor' || r.roleKey === 'author');

      if (isSuper) superAdmins++;
      else if (isSiteAdmin) siteAdmins++;
      else if (isEditor) editorsAuthors++;
    }

    return {
      total: users.length,
      activeCount,
      superAdmins,
      siteAdmins,
      editorsAuthors,
    };
  }, [users]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Users */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.users.totalUsers || 'Total Users'}
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Users className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
            {stats.activeCount} Active
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Across all publications
        </p>
      </div>

      {/* 2. Super Admins */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.users.superAdmins || 'Super Admins'}
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <ShieldCheck className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.superAdmins}
          </span>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
            Platform
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Global infrastructure access
        </p>
      </div>

      {/* 3. Site Admins */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.users.siteAdmins || 'Site Admins'}
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <Shield className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.siteAdmins}
          </span>
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
            Site Scoped
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Site configuration managers
        </p>
      </div>

      {/* 4. Editors & Authors */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.users.editorsAuthors || 'Editors & Authors'}
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
            <UserCheck className="size-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.editorsAuthors}
          </span>
          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded">
            Editorial
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Articles & media contributors
        </p>
      </div>
    </div>
  );
}
