'use client';

import React from 'react';
import {
  Activity,
  Database,
  Cpu,
  Clock,
  RotateCw,
  Globe,
  Users,
  FileText,
  ImageIcon,
  HardDrive,
} from 'lucide-react';
import type { PlatformSystemDiagnostics } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface SystemDiagnosticsCardProps {
  diagnostics?: PlatformSystemDiagnostics;
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function SystemDiagnosticsCard({
  diagnostics,
  isLoading,
  onRefresh,
  isRefreshing,
}: SystemDiagnosticsCardProps) {
  const { t } = useAdmin();

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '—';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const metrics = [
    {
      label: t('settings.databaseStatus'),
      value: diagnostics?.databaseStatus === 'up' ? 'Online (PostgreSQL 18)' : 'Degraded',
      badge: `${diagnostics?.databaseLatencyMs ?? 0}ms`,
      icon: Database,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('settings.uptime'),
      value: formatUptime(diagnostics?.uptimeSeconds),
      badge: 'Continuous',
      icon: Clock,
      color: 'text-blue-500',
    },
    {
      label: t('settings.memoryUsage'),
      value: `${diagnostics?.memoryUsageMb ?? 0} MB`,
      badge: 'V8 Heap',
      icon: Cpu,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: t('settings.nodeVersion'),
      value: diagnostics?.nodeVersion ?? 'Node 24',
      badge: diagnostics?.platform ?? 'Windows',
      icon: Activity,
      color: 'text-amber-700 dark:text-amber-400',
    },
  ];

  const counters = [
    { label: t('settings.totalSites'), value: diagnostics?.totalSites ?? 0, icon: Globe },
    { label: t('settings.totalUsers'), value: diagnostics?.totalUsers ?? 0, icon: Users },
    { label: t('settings.totalPosts'), value: diagnostics?.totalPosts ?? 0, icon: FileText },
    { label: t('settings.totalMedia'), value: diagnostics?.totalMediaAssets ?? 0, icon: ImageIcon },
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            {t('settings.diagnosticsTitle')}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {t('settings.diagnosticsDesc')}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{t('settings.refreshDiagnostics')}</span>
        </button>
      </div>

      {/* 4 Health Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {m.label}
                </span>
                <Icon className={`size-4 ${m.color}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                  {m.value}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {m.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entity Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        {counters.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3.5"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                  {c.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Environmental & Storage Banner */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HardDrive className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Storage Engine:{' '}
            <strong className="text-neutral-900 dark:text-neutral-100 uppercase">
              {diagnostics?.storageProvider ?? 'CLOUDINARY'}
            </strong>
          </span>
        </div>
        <div>
          <span>
            Environment:{' '}
            <strong className="text-neutral-900 dark:text-neutral-100 uppercase">
              {diagnostics?.environment ?? 'DEVELOPMENT'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
