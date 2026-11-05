'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';

import type { SiteDetailTab } from '../hooks/useSiteDetail';

interface SiteDetailHeaderProps {
  readonly site: SiteItem;
  readonly liveUrl: string | null;
  readonly domainCount: number;
  readonly activeTab: SiteDetailTab;
  readonly onTabChange: (tab: SiteDetailTab) => void;
}

const TAB =
  'px-3 py-1.5 rounded-lg transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600';

/** Title, identifiers, live link (only for a verified primary domain), tabs. */
export function SiteDetailHeader({
  site,
  liveUrl,
  domainCount,
  activeTab,
  onTabChange,
}: SiteDetailHeaderProps) {
  const { t } = useAdmin();
  const tabClass = (tab: SiteDetailTab) =>
    `${TAB} ${
      activeTab === tab
        ? 'bg-white dark:bg-slate-700 text-brand-950 dark:text-emerald-400 font-bold shadow-xs'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  return (
    <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/sites"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          aria-label={t.sites.backToSites || 'Back to Websites'}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {site.name}
            </h1>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              {site.key}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                site.status === 'active'
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              <span className="capitalize">{site.status}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Site ID:{' '}
            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
              {site.id}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {liveUrl ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 hover:border-emerald-300 text-xs font-semibold shadow-2xs transition-colors"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span>{t.sites.visitSite || 'Live Website'}</span>
          </a>
        ) : (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            No verified primary domain yet
          </span>
        )}

        <div
          className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
          role="group"
          aria-label="Site sections"
        >
          <button
            type="button"
            aria-pressed={activeTab === 'general'}
            onClick={() => onTabChange('general')}
            className={tabClass('general')}
          >
            {t.sites.generalSettings || 'General'}
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'domains'}
            onClick={() => onTabChange('domains')}
            className={tabClass('domains')}
          >
            {t.sites.manageDomains || 'Domains'} ({domainCount})
          </button>
        </div>
      </div>
    </div>
  );
}
