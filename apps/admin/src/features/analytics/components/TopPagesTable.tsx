'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Globe } from 'lucide-react';
import type { AnalyticsTopPage } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface TopPagesTableProps {
  pages: AnalyticsTopPage[];
  isLoading?: boolean;
}

export function TopPagesTable({ pages, isLoading }: TopPagesTableProps) {
  const { t } = useAdmin();

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const maxViews = Math.max(...pages.map((p) => p.pageViews), 1);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {t('analytics.topPerformingContent')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('analytics.topContentSubtitle')}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-3">{t('analytics.article')}</th>
              <th className="py-3 px-3">{t('analytics.website')}</th>
              <th className="py-3 px-3 text-right">{t('analytics.views')}</th>
              <th className="py-3 px-3 text-right">{t('analytics.uniqueReaders')}</th>
              <th className="py-3 px-3 text-right">{t('analytics.readTime')}</th>
              <th className="py-3 px-3 text-right">{t('analytics.bounce')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="size-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                    <span>Loading top articles...</span>
                  </div>
                </td>
              </tr>
            ) : pages.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('analytics.noData')}
                </td>
              </tr>
            ) : (
              pages.map((page, idx) => {
                const viewShare = Math.round((page.pageViews / maxViews) * 100);
                return (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Article / Page title and slug */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5 max-w-sm sm:max-w-md">
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <FileText className="size-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            <span>{page.title}</span>
                            {page.postId && (
                              <Link
                                href={`/posts/${page.postId}`}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-opacity"
                                title="Edit post"
                              >
                                <ExternalLink className="size-3" />
                              </Link>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {page.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Site Badge */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Globe className="size-3 text-slate-500 dark:text-slate-400" />
                        <span>{page.siteName}</span>
                      </span>
                    </td>

                    {/* Views & mini progress */}
                    <td className="py-3.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      <div>{page.pageViews.toLocaleString()}</div>
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${viewShare}%` }}
                        />
                      </div>
                    </td>

                    {/* Unique Visitors */}
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {page.uniqueVisitors.toLocaleString()}
                    </td>

                    {/* Avg Duration */}
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {formatDuration(page.avgDurationSeconds)}
                    </td>

                    {/* Bounce Rate */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`inline-block font-bold text-[11px] px-1.5 py-0.5 rounded-md ${
                          page.bounceRate < 40
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        {page.bounceRate}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

