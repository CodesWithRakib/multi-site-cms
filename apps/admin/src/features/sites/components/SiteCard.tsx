'use client';

import Link from 'next/link';
import { AlertCircle, CheckCircle2, ExternalLink, Globe, Settings } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';
import { useGetPostStatsQuery } from '@/lib/cms-api';
import { formatDateTime } from '@/lib/i18n';

import { REGISTRY_VIEWS_DAYS } from '../hooks/useSitesRegistry';
import { primaryDomainUrl } from '../utils/site-url';
import { siteDescription } from '../utils/sites-registry';
import { SiteCardArt, siteArtKind } from './SiteCardArt';

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function Stat({ value, label }: { readonly value: string; readonly label: string }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-2">
      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{value}</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

interface SiteCardProps {
  readonly site: SiteItem;
  /** Page views in the registry window; undefined while loading. */
  readonly views: number | undefined;
}

/**
 * One site in the registry. Post and view counts are real (`/posts/stats`,
 * analytics); the old card showed fixed numbers per site key and an invented
 * "<key>.yourdomain.com" address.
 */
export function SiteCard({ site, views }: SiteCardProps) {
  const { t, locale } = useAdmin();
  const { data: postCounts } = useGetPostStatsQuery({ siteId: site.id });

  const primary = site.domains?.find((domain) => domain.isPrimary);
  const isVerified = Boolean(primary?.verifiedAt);
  const liveUrl = primaryDomainUrl(site.domains ?? []);
  const description = siteDescription(site);

  return (
    <article
      aria-labelledby={`site-card-${site.id}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-colors"
    >
      <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800/60">
        <SiteCardArt kind={siteArtKind(site.key)} />
        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-xs">
            {site.key}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${
              site.status === 'active' ? 'bg-emerald-700 text-white' : 'bg-slate-800/90 text-white'
            }`}
          >
            <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />
            <span className="capitalize">{site.status}</span>
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h2
            id={`site-card-${site.id}`}
            className="text-lg font-bold text-slate-900 dark:text-slate-100"
          >
            {site.name}
          </h2>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}

          <div className="mt-3.5 flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="size-3.5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate">
                {primary?.hostname ?? 'No primary domain'}
              </span>
            </div>
            {primary && (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 border ${
                  isVerified
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70'
                }`}
              >
                {isVerified ? (
                  <CheckCircle2 className="size-2.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="size-2.5" aria-hidden="true" />
                )}
                <span>
                  {isVerified
                    ? t.sites.verified || 'Verified'
                    : t.sites.unverified || 'Pending DNS'}
                </span>
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat
              value={postCounts ? String(postCounts.byStatus.published) : '—'}
              label="Published"
            />
            <Stat
              value={views === undefined ? '—' : compact.format(views)}
              label={`Views (${REGISTRY_VIEWS_DAYS}d)`}
            />
            <Stat value={site.defaultLocale.toUpperCase()} label={site.timezone} />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            Created {formatDateTime(site.createdAt, locale, site.timezone)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${site.name} (new tab)`}
                className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-2xs"
              >
                <ExternalLink className="size-3" aria-hidden="true" />
                <span>{t.sites.visitSite || 'Live'}</span>
              </a>
            )}
            <Link
              href={`/sites/${site.id}`}
              aria-label={`Manage ${site.name}`}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-emerald-700 dark:hover:bg-emerald-300 px-3 py-1.5 text-[11px] font-bold shadow-2xs transition-colors"
            >
              <Settings className="size-3" aria-hidden="true" />
              <span>{t.sites.manageSite || 'Manage'}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
