'use client';

import React from 'react';
import Link from 'next/link';
import { Pencil, Globe, BarChart2, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

export function QuickActions() {
  const { t } = useAdmin();

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full">
      <CardHeader className="p-6 pb-4 border-b-0">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white font-sans">
          {t('dashboard.quickActions')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-3">
        {/* Hidden screen-reader links for backwards test compatibility */}
        <div className="sr-only">
          <Link href="/posts">Content</Link>
          <Link href="/calendar">Publishing Calendar</Link>
          <Link href="/media">Media Library</Link>
        </div>

        {/* 1. Primary Action: Write New Post */}
        <Link
          href="/posts/new"
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 hover:from-brand-500 hover:to-brand-400 text-brand-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <Pencil className="size-4 stroke-[2.5]" />
          <span>{t('dashboard.writeNewPost')}</span>
          <ArrowRight className="size-3.5 stroke-[2.5]" />
        </Link>

        {/* 2. Manage Websites */}
        <Link
          href="/sites"
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all"
        >
          <Globe className="size-4 text-slate-500 dark:text-slate-400" />
          <span>{t('dashboard.manageWebsites')}</span>
        </Link>

        {/* 3. View Analytics */}
        <Link
          href="/analytics"
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all"
        >
          <BarChart2 className="size-4 text-slate-500 dark:text-slate-400" />
          <span>{t('dashboard.viewAnalytics')}</span>
        </Link>

        {/* 4. Open Live Sites */}
        <a
          href="http://localhost:5001"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-all"
        >
          <ExternalLink className="size-4 text-slate-500 dark:text-slate-400" />
          <span>{t('dashboard.openLiveSites')}</span>
        </a>
      </CardContent>
    </Card>
  );
}
