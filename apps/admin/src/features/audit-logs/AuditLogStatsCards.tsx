'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, FileEdit, Users2 } from 'lucide-react';
import type { AuditLogCategory, AuditLogSummary } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface AuditLogStatsCardsProps {
  summary?: AuditLogSummary;
  isLoading: boolean;
  activeCategory?: AuditLogCategory;
  onSelectCategory?: (category: AuditLogCategory) => void;
}

export function AuditLogStatsCards({
  summary,
  isLoading,
  activeCategory = 'all',
  onSelectCategory,
}: AuditLogStatsCardsProps) {
  const { t } = useAdmin();

  const cards: Array<{
    category: AuditLogCategory;
    title: string;
    value: number;
    icon: typeof ShieldCheck;
    color: string;
    bgColor: string;
    borderColor: string;
    badge: string;
  }> = [
    {
      category: 'all',
      title: t('auditLogs.totalEvents'),
      value: summary?.totalEvents ?? 0,
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      badge: `${summary?.uniqueActorsCount ?? 0} ${t('auditLogs.uniqueActors')}`,
    },
    {
      category: 'auth',
      title: t('auditLogs.authEvents'),
      value: summary?.securityAuthEvents ?? 0,
      icon: ShieldAlert,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      badge: 'Auth & MFA',
    },
    {
      category: 'content',
      title: t('auditLogs.contentEvents'),
      value: summary?.contentEvents ?? 0,
      icon: FileEdit,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      badge: 'Posts & Media',
    },
    {
      category: 'system',
      title: t('auditLogs.systemEventsCount'),
      value: summary?.systemRoleEvents ?? 0,
      icon: Users2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      badge: 'Roles & Config',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isSelected = activeCategory === card.category;

        return (
          <button
            type="button"
            key={card.category}
            onClick={() => onSelectCategory?.(card.category)}
            className={`flex flex-col justify-between p-4.5 rounded-xl border text-left bg-white dark:bg-neutral-900 shadow-xs transition-all cursor-pointer ${
              isSelected
                ? 'ring-2 ring-emerald-500 border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/40 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bgColor} ${card.color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between w-full">
              {isLoading ? (
                <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md" />
              ) : (
                <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                  {card.value.toLocaleString()}
                </span>
              )}

              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {card.badge}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
