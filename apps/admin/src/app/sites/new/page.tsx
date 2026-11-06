'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Plus, Globe } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { useCreateSiteMutation } from '@/lib/cms-api';

import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';

const FIELD_SELECT_CLASS =
  'px-3.5 py-2.5 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:border-emerald-400 focus:ring-emerald-400/20 shadow-2xs';

const LOCALE_OPTIONS: NativeSelectOption[] = [
  { value: 'en', label: 'English (en)' },
  { value: 'bn', label: 'Bangla (bn)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'fr', label: 'French (fr)' },
];

const TIMEZONE_OPTIONS: NativeSelectOption[] = [
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

export default function NewSitePage() {
  const router = useRouter();
  const { t } = useAdmin();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [defaultLocale, setDefaultLocale] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createSite, { isLoading }] = useCreateSiteMutation();

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key) {
      setKey(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !key.trim()) {
      setErrorMsg('Site name and key are required.');
      return;
    }

    try {
      const newSite = await createSite({
        name: name.trim(),
        key: key.trim().toLowerCase(),
        defaultLocale,
        timezone,
      }).unwrap();

      router.push(`/sites/${newSite.id}`);
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Failed to create site.');
    }
  };

  return (
    <ShellLayout superAdminOnly>
      <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
        {/* Sticky Frosted Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/sites"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title={t.sites.backToSites || 'Back to Websites'}
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.sites.createSite || 'Register New Site'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provision a new independent publication tenant in the multi-site registry.
              </p>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-300 shadow-2xs">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <Globe className="size-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Tenant Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Configure primary metadata and tenant identification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.sites.siteName || 'Site Name'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Travel Blog or Air Sports"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.sites.siteKey || 'Unique Site Key'} *
                </label>
                {key && (
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    tenant: {key}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase())}
                placeholder="e.g. travel-blog or air-sports"
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Lowercase letters, numbers, and hyphens. Used in API routing, edge proxy, and tenant
                scoping.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="site-default-locale"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {t.sites.defaultLocale || 'Default Locale'}
                </label>
                <NativeSelect
                  id="site-default-locale"
                  value={defaultLocale}
                  onValueChange={setDefaultLocale}
                  options={LOCALE_OPTIONS}
                  className={FIELD_SELECT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="site-timezone"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {t.sites.timezone || 'Timezone'}
                </label>
                <NativeSelect
                  id="site-timezone"
                  value={timezone}
                  onValueChange={setTimezone}
                  options={TIMEZONE_OPTIONS}
                  className={FIELD_SELECT_CLASS}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/sites"
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {t.actions.cancel || 'Cancel'}
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-brand-950" />
                ) : (
                  <Plus className="size-4 stroke-[2.5]" />
                )}
                <span>{t.sites.createSite || 'Provision Tenant'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </ShellLayout>
  );
}
