'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MoreVertical, Link2, Eye, Globe, Users } from 'lucide-react';
import type { AnalyticsSitePerformance } from '@multi-site-cms/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';

export interface YourWebsitesProps {
  /** Real per-site traffic for the selected period; undefined while loading. */
  sitePerformance?: AnalyticsSitePerformance[];
}

const compactNumber = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function YourWebsites({ sitePerformance }: YourWebsitesProps) {
  const { availableSites, setActiveSiteId, isSuperAdmin, t } = useAdmin();

  const performanceBySite = React.useMemo(
    () => new Map((sitePerformance ?? []).map((entry) => [entry.siteId, entry])),
    [sitePerformance],
  );

  return (
    <Card className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full">
      <CardHeader className="p-6 pb-4 border-b-0 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white font-sans">
            {t('dashboard.yourWebsites')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('dashboard.manageWebsitesSub')} ({availableSites.length} {t('dashboard.registered')})
          </CardDescription>
        </div>
        {isSuperAdmin && (
          <Link
            href="/sites"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
          >
            <span>{t('dashboard.viewAll')}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {availableSites.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Globe className="size-8 text-slate-500 dark:text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No websites found
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isSuperAdmin
                ? 'Create your first website property to begin publishing.'
                : 'No website is assigned to your account yet. Ask a Super Admin for access.'}
            </p>
            {isSuperAdmin && (
              <Link
                href="/sites"
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Add Website
              </Link>
            )}
          </div>
        ) : (
          availableSites.map((site) => {
            const isAirSports = site.key.toLowerCase().includes('air');
            const primaryDomain =
              site.domains?.find((d) => d.isPrimary)?.hostname ||
              site.domains?.[0]?.hostname ||
              `${site.key}.yourdomain.com`;
            const domainUrl = `https://${primaryDomain}`;
            const performance = performanceBySite.get(site.id);
            const viewsLabel = sitePerformance
              ? `${compactNumber.format(performance?.pageViews ?? 0)} Views`
              : '…';
            const visitorsLabel = sitePerformance
              ? `${compactNumber.format(performance?.uniqueVisitors ?? 0)} Visitors`
              : '…';
            const isActive = site.status === 'active';

            return (
              <div
                key={site.id}
                className="flex flex-col justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all group"
              >
                {/* Left Thumbnail + Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Dynamic Thumbnail */}
                  <div className="relative size-16 sm:w-20 sm:h-14 rounded-xl overflow-hidden shrink-0 shadow-2xs">
                    {isAirSports ? (
                      // Red Air Sports airplane in sky SVG
                      <svg viewBox="0 0 160 110" className="size-full object-cover" fill="none">
                        <defs>
                          <linearGradient id={`airSky-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="70%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#e0f2fe" />
                          </linearGradient>
                        </defs>
                        <rect width="160" height="110" fill={`url(#airSky-${site.id})`} />
                        <ellipse cx="30" cy="80" rx="35" ry="14" fill="#ffffff" fillOpacity="0.8" />
                        <ellipse cx="60" cy="85" rx="30" ry="12" fill="#ffffff" fillOpacity="0.9" />
                        <ellipse
                          cx="130"
                          cy="75"
                          rx="40"
                          ry="16"
                          fill="#ffffff"
                          fillOpacity="0.75"
                        />
                        <g transform="translate(68, 42) rotate(-15)">
                          <path d="M -28 -2 L 28 -2 L 22 2 L -22 2 Z" fill="#dc2626" />
                          <rect x="-3" y="-14" width="6" height="28" rx="2" fill="#b91c1c" />
                          <path d="M -12 12 L 12 12 L 0 6 Z" fill="#991b1b" />
                          <polygon points="0,6 0,-2 4,6" fill="#ef4444" />
                          <circle cx="0" cy="-14" r="2" fill="#facc15" />
                        </g>
                      </svg>
                    ) : (
                      // Scenic alpine mountain & turquoise lake SVG
                      <svg viewBox="0 0 160 110" className="size-full object-cover" fill="none">
                        <defs>
                          <linearGradient id={`travelSky-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="60%" stopColor="#bae6fd" />
                            <stop offset="100%" stopColor="#f0f9ff" />
                          </linearGradient>
                          <linearGradient id={`travelLake-${site.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0284c7" />
                            <stop offset="50%" stopColor="#0d9488" />
                            <stop offset="100%" stopColor="#042f2e" />
                          </linearGradient>
                        </defs>
                        <rect width="160" height="110" fill={`url(#travelSky-${site.id})`} />
                        <polygon points="10,65 50,25 90,65" fill="#64748b" />
                        <polygon points="40,35 50,25 60,35 55,38 50,33 45,38" fill="#f8fafc" />
                        <polygon points="65,65 105,18 145,65" fill="#475569" />
                        <polygon points="95,29 105,18 115,29 110,32 105,27 100,32" fill="#f8fafc" />
                        <path
                          d="M0 70 Q40 50 80 68 Q120 52 160 65 L160 110 L0 110 Z"
                          fill="#15803d"
                        />
                        <path
                          d="M0 78 C30 74 130 74 160 78 L160 110 L0 110 Z"
                          fill={`url(#travelLake-${site.id})`}
                        />
                        <polygon points="15,75 18,65 21,75" fill="#14532d" />
                        <polygon points="20,78 24,67 28,78" fill="#166534" />
                        <polygon points="135,76 138,66 141,76" fill="#14532d" />
                      </svg>
                    )}
                  </div>

                  {/* Title, Status & URL */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {site.name}
                      </h4>
                      <div
                        className={`flex items-center gap-1 text-[11px] font-semibold ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span className="capitalize">
                          {isActive ? t('dashboard.active') : site.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <Link2 className="size-3 shrink-0" />
                      <span className="truncate">{domainUrl}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Posts, Views, Manage Button */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-between">
                  <div className="flex flex-col text-left text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Eye className="size-3 text-slate-500 dark:text-slate-400" />
                      <span>{viewsLabel}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:justify-end mt-0.5">
                      <Users className="size-3 text-slate-500 dark:text-slate-400" />
                      <span>{visitorsLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {availableSites.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSiteId(site.id);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title={`Filter dashboard to ${site.name}`}
                      >
                        <span>{t('dashboard.manage')}</span>
                        <ArrowRight className="size-3" />
                      </button>
                    )}

                    {isSuperAdmin && (
                      <Link
                        href={`/sites`}
                        className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        aria-label={`Options for ${site.name}`}
                      >
                        <MoreVertical className="size-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
