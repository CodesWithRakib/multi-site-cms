'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Save, Settings } from 'lucide-react';
import type { SiteItem, SiteStatus } from '@multi-site-cms/types';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';

import { useAdmin } from '@/lib/admin-context';

import type { SiteGeneralValues } from '../hooks/useSiteDetail';

const TIMEZONES = [
  ['UTC', 'UTC (Coordinated Universal Time)'],
  ['Asia/Dhaka', 'Asia/Dhaka (GMT+6)'],
  ['America/New_York', 'America/New_York (EST/EDT)'],
  ['Europe/London', 'Europe/London (GMT/BST)'],
  ['Europe/Paris', 'Europe/Paris (CET)'],
  ['Asia/Tokyo', 'Asia/Tokyo (JST)'],
] as const;

const LOCALES = [
  ['en', 'English (en)'],
  ['bn', 'Bangla (bn)'],
  ['es', 'Spanish (es)'],
  ['fr', 'French (fr)'],
] as const;

const STATUSES: ReadonlyArray<readonly [SiteStatus, string]> = [
  ['active', 'Active (serving traffic)'],
  ['paused', 'Paused'],
  ['suspended', 'Suspended (access disabled)'],
];

const FIELD =
  'w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs';
const SELECT_FIELD =
  'px-3.5 py-2.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-2xs';
const LABEL = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

/** Options plus the stored value when it is not one of them (never hide data). */
function withCurrent(
  options: ReadonlyArray<readonly [string, string]>,
  current: string,
): ReadonlyArray<readonly [string, string]> {
  return options.some(([value]) => value === current) ? options : [[current, current], ...options];
}

function toOptions(pairs: ReadonlyArray<readonly [string, string]>): NativeSelectOption[] {
  return pairs.map(([value, label]) => ({ value, label }));
}

interface SiteGeneralFormProps {
  readonly site: SiteItem;
  readonly isSaving: boolean;
  readonly onSave: (values: SiteGeneralValues) => Promise<void>;
}

/** Name, timezone, default locale, and operational status of a site. */
export function SiteGeneralForm({ site, isSaving, onSave }: SiteGeneralFormProps) {
  const { t } = useAdmin();
  const [values, setValues] = useState<SiteGeneralValues>({
    name: site.name,
    timezone: site.timezone || 'UTC',
    defaultLocale: site.defaultLocale || 'en',
    status: site.status,
  });
  const set = <K extends keyof SiteGeneralValues>(key: K, value: SiteGeneralValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSave(values);
  };

  return (
    <section
      aria-labelledby="site-general-heading"
      className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs"
    >
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <Settings className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div>
          <h2
            id="site-general-heading"
            className="text-sm font-bold text-slate-900 dark:text-slate-100"
          >
            {t.sites.generalSettings || 'General configuration'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Display name, default editorial language, timezone, and operational state.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="site-name" className={LABEL}>
            {t.sites.siteName || 'Site name'}
          </label>
          <input
            id="site-name"
            type="text"
            required
            maxLength={255}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            className={FIELD}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="site-timezone" className={LABEL}>
              {t.sites.timezone || 'Timezone'}
            </label>
            <NativeSelect
              id="site-timezone"
              value={values.timezone}
              onValueChange={(value) => set('timezone', value)}
              options={toOptions(withCurrent(TIMEZONES, values.timezone))}
              className={SELECT_FIELD}
            />
          </div>

          <div>
            <label htmlFor="site-locale" className={LABEL}>
              {t.sites.defaultLocale || 'Default locale'}
            </label>
            <NativeSelect
              id="site-locale"
              value={values.defaultLocale}
              onValueChange={(value) => set('defaultLocale', value)}
              options={toOptions(withCurrent(LOCALES, values.defaultLocale))}
              className={SELECT_FIELD}
            />
          </div>

          <div>
            <label htmlFor="site-status" className={LABEL}>
              Operational status
            </label>
            <NativeSelect
              id="site-status"
              value={values.status}
              onValueChange={(value) => {
                const match = STATUSES.find(([status]) => status === value);
                if (match) set('status', match[0]);
              }}
              options={toOptions(withCurrent(STATUSES, values.status))}
              className={SELECT_FIELD}
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            <span>{isSaving ? 'Saving…' : 'Save configuration'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
