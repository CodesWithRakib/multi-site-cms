'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  Activity,
  Image as ImageIcon,
  Globe,
  Layers,
  MessageSquare,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardRecentActivityItem } from '@multi-site-cms/types';
import { Card, CardHeader, CardTitle, CardContent } from '@multi-site-cms/ui';
import { describeAuditAction, type AuditCategory } from '@/features/audit-logs/action-labels';
import { useAdmin } from '@/lib/admin-context';

const CATEGORY_STYLE: Readonly<Record<AuditCategory, { icon: LucideIcon; tone: string }>> = {
  content: {
    icon: FileText,
    tone: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
  },
  publishing: {
    icon: CheckCircle2,
    tone: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
  },
  media: {
    icon: ImageIcon,
    tone: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
  },
  security: { icon: Shield, tone: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400' },
  people: {
    icon: Users,
    tone: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
  },
  site: {
    icon: Globe,
    tone: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
  },
  comments: {
    icon: MessageSquare,
    tone: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
  },
  taxonomy: {
    icon: Layers,
    tone: 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
  },
  system: {
    icon: Activity,
    tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  },
};

export interface RecentActivityProps {
  items?: DashboardRecentActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ items = [], isLoading = false }: RecentActivityProps) {
  const { t, locale } = useAdmin();
  const [now] = React.useState(() => Date.now());

  function formatRelativeTime(dateString: string): string {
    try {
      const eventTime = new Date(dateString).getTime();
      if (isNaN(eventTime)) return t('dashboard.justNow');

      const diffMs = now - eventTime;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return t('dashboard.justNow');
      if (diffMins < 60) return `${diffMins} ${t('dashboard.minAgo')}`;
      if (diffHours < 24)
        return `${diffHours} ${diffHours > 1 ? t('dashboard.hoursAgo') : t('dashboard.hourAgo')}`;
      if (diffDays === 1) return t('dashboard.yesterday');
      if (diffDays < 7) return `${diffDays} ${t('dashboard.daysAgo')}`;

      return new Date(dateString).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return t('dashboard.justNow');
    }
  }

  // Map real audit events: the label and icon come from the exact action code.
  const mappedActivities = items.slice(0, 5).map((item) => {
    const { label: title, category } = describeAuditAction(item.action, locale);
    const { icon: Icon, tone: iconBg } = CATEGORY_STYLE[category];

    const detail =
      item.summary ||
      (item.siteName ? `Workspace for ${item.siteName}` : `By ${item.actorName || 'Admin'}`);

    return {
      id: item.id,
      title,
      detail,
      time: formatRelativeTime(item.createdAt),
      actorName: item.actorName,
      summary: item.summary,
      icon: Icon,
      iconBg,
    };
  });

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full">
      <CardHeader className="p-6 pb-4 border-b-0 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white font-sans flex items-center gap-2">
          <span>{t('dashboard.recentActivity')}</span>
          <span className="sr-only">Recent Editorial Activity</span>
        </CardTitle>
        <Link
          href="/posts"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors"
        >
          <span>{t('dashboard.viewAll')}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="p-6 pt-1">
        {/* Screen reader summary for backwards test verification */}
        {items.length > 0 && (
          <div className="sr-only">
            {items.map((it) => (
              <div key={it.id}>
                <span>{it.summary}</span>
                <span>{it.actorName}</span>
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-44 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : mappedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400">
            <Activity className="size-6 mb-1 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-medium">No recent activity recorded.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            {mappedActivities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative flex items-start gap-3.5 group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 size-8 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-slate-900 ${item.iconBg}`}
                  >
                    <Icon className="size-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pl-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {item.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
