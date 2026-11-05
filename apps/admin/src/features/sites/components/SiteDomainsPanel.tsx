'use client';

import { AlertCircle, CheckCircle2, Globe, Radio, Trash2 } from 'lucide-react';
import type { SiteDomainItem } from '@multi-site-cms/types';

interface SiteDomainsPanelProps {
  readonly domains: readonly SiteDomainItem[];
  readonly onShowDns: (domainId: string) => void;
  readonly onMakePrimary: (domain: SiteDomainItem) => void;
  readonly onRemove: (domain: SiteDomainItem) => void;
}

const SMALL_BUTTON =
  'px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer';

/** Hostnames bound to the site, with verification state and actions. */
export function SiteDomainsPanel({
  domains,
  onShowDns,
  onMakePrimary,
  onRemove,
}: SiteDomainsPanelProps) {
  return (
    <section
      aria-labelledby="site-domains-heading"
      className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <Radio className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div>
            <h2
              id="site-domains-heading"
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              Bound hostnames
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hostnames that serve this website. Only a verified primary domain is linked publicly.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {domains.length} {domains.length === 1 ? 'domain' : 'domains'}
        </span>
      </div>

      {domains.length === 0 ? (
        <p className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
          No domains bound to this site yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {domains.map((domain) => {
            const isVerified = domain.verifiedAt !== null;
            return (
              <li
                key={domain.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  <Globe className="size-4 text-slate-500" aria-hidden="true" />
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 break-all">
                    {domain.hostname}
                  </span>
                  {domain.isPrimary && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Primary
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                      isVerified
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="size-3" aria-hidden="true" />
                    )}
                    <span>{isVerified ? 'Verified' : 'Pending DNS'}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={() => onShowDns(domain.id)}
                      className={`${SMALL_BUTTON} text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80`}
                    >
                      DNS instructions
                    </button>
                  )}
                  {!domain.isPrimary && (
                    <>
                      <button
                        type="button"
                        onClick={() => onMakePrimary(domain)}
                        className={`${SMALL_BUTTON} text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700`}
                      >
                        Make primary
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(domain)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                        aria-label={`Remove ${domain.hostname}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
