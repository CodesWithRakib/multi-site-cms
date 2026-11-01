'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, Plus, Search, Settings, Loader2 } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';
import { useListSitesQuery } from '@/lib/cms-api';

export default function SitesRegistryPage() {
  const { t, locale } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: sites = [], isLoading } = useListSitesQuery();

  const filteredSites = sites.filter((site) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      site.name.toLowerCase().includes(term) ||
      site.key.toLowerCase().includes(term) ||
      site.domains?.some((d) => d.hostname.toLowerCase().includes(term))
    );
  });

  return (
    <ShellLayout superAdminOnly>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.sites.title}
              </h1>
              <span className="rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Super Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.sites.subtitle}</p>
          </div>

          <Link
            href="/sites/new"
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.sites.createSite}</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sites by name, key, or domain..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Sites Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-400">Loading site registry...</p>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No sites found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSites.map((site) => {
              const primaryDomain = site.domains?.find((d) => d.isPrimary);
              const isVerified = primaryDomain?.verifiedAt !== null;

              return (
                <div
                  key={site.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Top status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {site.key}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          site.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="capitalize">{site.status}</span>
                      </span>
                    </div>

                    {/* Site Name & Primary Domain */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {site.name}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px] truncate">
                          {primaryDomain?.hostname || 'No primary domain'}
                        </span>
                        {primaryDomain && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}
                          >
                            {isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span>Locale: {site.defaultLocale}</span>
                        <span>•</span>
                        <span>TZ: {site.timezone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Created: {formatDateTime(site.createdAt, locale, site.timezone)}
                    </span>

                    <Link
                      href={`/sites/${site.id}`}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Manage Site</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
