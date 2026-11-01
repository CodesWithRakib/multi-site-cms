'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';
import { useGetPublishingHealthQuery, useListPostsQuery } from '@/lib/cms-api';

export default function AdminDashboardPage() {
  const { t, locale, activeSiteId, activeSite, isSuperAdmin } = useAdmin();

  // 1. Fetch real content items
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
  } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    limit: 50,
  });

  // 2. Fetch real operational health metrics from Phase 08
  const { data: healthStats, refetch: refetchHealth } = useGetPublishingHealthQuery(undefined, {
    pollingInterval: 15000,
  });

  // 3. Derive real metrics
  const posts = postsData?.items || [];
  const totalPosts = postsData?.total ?? posts.length;

  let draftsCount = 0;
  let inReviewCount = 0;
  let scheduledCount = 0;
  let publishedCount = 0;

  const upcomingScheduled: Array<{
    id: string;
    postId: string;
    title: string;
    slug: string;
    scheduledFor: string;
  }> = [];

  for (const post of posts) {
    const pub = activeSiteId
      ? post.publications?.find((p) => p.siteId === activeSiteId)
      : post.publications?.[0];

    const status = pub?.status || post.status;
    if (status === 'draft') draftsCount++;
    else if (status === 'in_review') inReviewCount++;
    else if (status === 'scheduled') {
      scheduledCount++;
      if (pub?.scheduledFor) {
        upcomingScheduled.push({
          id: pub.id,
          postId: post.id,
          title: post.currentRevision?.title || pub.slug,
          slug: pub.slug,
          scheduledFor: pub.scheduledFor,
        });
      }
    } else if (status === 'published') publishedCount++;
  }

  // Sort upcoming chronologically
  upcomingScheduled.sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
  );

  const timezone = activeSite?.timezone || 'UTC';

  return (
    <ShellLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {activeSite ? activeSite.name : t.dashboard.title}
              </h1>
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {activeSite ? activeSite.key : 'Platform'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeSite
                ? `Publishing workspace for ${activeSite.name} (Timezone: ${timezone})`
                : t.dashboard.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                refetchPosts();
                refetchHealth();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.actions.refresh}</span>
            </button>

            <Link
              href="/posts/new"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.dashboard.newPost}</span>
            </Link>
          </div>
        </div>

        {/* Real Content Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Content */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.totalContent}
              </span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {isLoadingPosts ? '—' : totalPosts}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Canonical Source Items</span>
          </div>

          {/* Drafts */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{t.dashboard.drafts}</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              {isLoadingPosts ? '—' : draftsCount}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Work-in-progress</span>
          </div>

          {/* In Review */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{t.dashboard.inReview}</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
              {isLoadingPosts ? '—' : inReviewCount}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Pending Review</span>
          </div>

          {/* Scheduled */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.scheduledPosts}
              </span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
              {isLoadingPosts ? '—' : scheduledCount}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Auto-publishing</span>
          </div>

          {/* Published */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {t.dashboard.publishedPosts}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {isLoadingPosts ? '—' : publishedCount}
            </p>
            <span className="text-[10px] text-slate-400 font-medium">Live on Target Site</span>
          </div>
        </div>

        {/* Operational Health Widget (Real Phase 08 Backend Telemetry) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">{t.dashboard.healthTitle}</h3>
                <p className="text-[11px] text-slate-400">
                  Transactional Outbox & Row-Locking Background Polling Workers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>FOR UPDATE SKIP LOCKED</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {t.dashboard.workerActive}
              </span>
              <p className="font-bold text-slate-100 mt-0.5">
                {healthStats?.isScheduledWorkerActive ? 'Online (5s tick)' : 'Inactive'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {t.dashboard.outboxActive}
              </span>
              <p className="font-bold text-slate-100 mt-0.5">
                {healthStats?.isOutboxDispatcherActive ? 'Online (3s tick)' : 'Inactive'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {t.dashboard.pendingQueue}
              </span>
              <p className="font-bold text-slate-100 mt-0.5">
                {healthStats?.scheduledPublicationsPending ?? 0} items
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {t.dashboard.deadLetterQueue}
              </span>
              <p className="font-bold text-slate-100 mt-0.5">
                {healthStats?.outboxDeadLetterCount ?? 0} errors
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Workspace Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Publications (2 Columns) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.dashboard.upcomingPublications}
              </h3>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <span>{t.dashboard.viewCalendar}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingScheduled.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                <span>{t.dashboard.noUpcoming}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingScheduled.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">/{item.slug}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-200/60 dark:border-purple-800/60">
                        {formatDateTime(item.scheduledFor, locale, timezone)}
                      </span>
                      <Link
                        href={`/posts/${item.postId}/edit`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1"
                      >
                        {t.actions.edit}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions & Short Navigation (1 Column) */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                {t.dashboard.quickActions}
              </h3>

              <div className="space-y-2">
                <Link
                  href="/posts/new"
                  className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold text-xs hover:bg-blue-100/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>{t.dashboard.newPost}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/calendar"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span>{t.dashboard.viewCalendar}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/media"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>{t.dashboard.openMedia}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {isSuperAdmin && (
                  <Link
                    href="/sites"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span>{t.nav.sites}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Site domain reminder */}
            {activeSite && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Domain:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  {activeSite.domains?.find((d) => d.isPrimary)?.hostname || 'localhost'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
