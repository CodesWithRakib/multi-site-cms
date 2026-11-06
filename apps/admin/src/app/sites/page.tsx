'use client';

import Link from 'next/link';
import { Globe, Loader2, Plus, RefreshCw } from 'lucide-react';

import { ShellLayout } from '@/components/shell';
import { SiteCard } from '@/features/sites/components/SiteCard';
import { SitesFilters } from '@/features/sites/components/SitesFilters';
import { SitesStatsCards } from '@/features/sites/components/SitesStatsCards';
import { useSitesRegistry } from '@/features/sites/hooks/useSitesRegistry';
import { useAdmin } from '@/lib/admin-context';

const CREATE_LINK =
  'flex items-center gap-2 rounded-xl bg-brand-600 text-white font-bold px-4 py-2 text-xs shadow-xs hover:brightness-105 transition-all';

/**
 * Site registry: orchestration only. Data comes from useSitesRegistry; each
 * section is a component in features/sites.
 */
export default function SitesRegistryPage() {
  const { t } = useAdmin();
  const registry = useSitesRegistry();

  return (
    <ShellLayout superAdminOnly>
      <div className="w-full space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.sites.title || 'Site registry'}
              </h1>
              <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {t.sites.superAdminOnly || 'Super Admin only'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {t.sites.subtitle || 'Sites, domain bindings, and their publishing state.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={() => void registry.refetch()}
              disabled={registry.isFetching}
              aria-label="Refresh sites"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${registry.isFetching ? 'animate-spin text-emerald-600' : ''}`}
                aria-hidden="true"
              />
            </button>
            <Link href="/sites/new" className={CREATE_LINK}>
              <Plus className="size-4 stroke-[2.5]" aria-hidden="true" />
              <span>{t.sites.createSite || 'Register new site'}</span>
            </Link>
          </div>
        </div>

        <SitesStatsCards
          stats={registry.stats}
          publishedPosts={registry.publishedPosts}
          isLoading={registry.isLoading || registry.isPostCountsLoading}
        />

        <SitesFilters
          stats={registry.stats}
          status={registry.status}
          onStatusChange={registry.setStatus}
          search={registry.search}
          onSearchChange={registry.setSearch}
          hasFilters={registry.hasFilters}
          onClear={registry.clearFilters}
        />

        {registry.isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3" role="status">
            <Loader2 className="size-7 animate-spin text-emerald-600" aria-hidden="true" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Loading websites…
            </p>
          </div>
        ) : registry.visibleSites.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <Globe className="size-12 text-slate-300 dark:text-slate-700" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {registry.hasFilters
                ? t.sites.noSitesFound || 'No websites match your filters.'
                : 'No websites yet.'}
            </p>
            {registry.hasFilters ? (
              <button
                type="button"
                onClick={registry.clearFilters}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            ) : (
              <Link href="/sites/new" className={`mt-2 ${CREATE_LINK}`}>
                <Plus className="size-4 stroke-[2.5]" aria-hidden="true" />
                <span>{t.sites.createSite || 'Register new site'}</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {registry.visibleSites.map((site) => (
              <SiteCard key={site.id} site={site} views={registry.viewsFor(site.id)} />
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
