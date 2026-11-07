'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import type { PlatformGeneralSettings } from '@multi-site-cms/types';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';
import { SETTINGS_SELECT_CLASS } from './form-styles';

const LOCALE_OPTIONS: NativeSelectOption[] = [
  { value: 'en', label: 'English (en)' },
  { value: 'bn', label: 'বাংলা (bn)' },
];

const TIMEZONE_OPTIONS: NativeSelectOption[] = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (GMT+6)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

interface GeneralSettingsFormProps {
  initialData?: PlatformGeneralSettings;
  onSave: (data: PlatformGeneralSettings) => Promise<boolean>;
  isSaving: boolean;
}

export function GeneralSettingsForm({ initialData, onSave, isSaving }: GeneralSettingsFormProps) {
  const { t } = useAdmin();

  const [formData, setFormData] = useState<PlatformGeneralSettings>({
    platformName: initialData?.platformName ?? 'Multi-Site CMS Enterprise',
    tagline:
      initialData?.tagline ?? 'Centralized multi-tenant publication and content delivery platform',
    contactEmail: initialData?.contactEmail ?? 'admin@platform.internal',
    defaultLocale: initialData?.defaultLocale ?? 'en',
    defaultTimezone: initialData?.defaultTimezone ?? 'UTC',
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    const success = await onSave(formData);
    if (success) {
      setStatusMessage({ type: 'success', text: t('settings.savedSuccess') });
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage({ type: 'error', text: t('settings.saveError') });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t('settings.generalTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.generalDesc')}
        </p>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 text-xs font-medium rounded-xl border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        {/* Platform Name */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.platformName')}
          </label>
          <input
            type="text"
            required
            value={formData.platformName}
            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
            placeholder={t('settings.platformNamePlaceholder')}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.tagline')}
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            placeholder={t('settings.taglinePlaceholder')}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Contact Support Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.contactEmail')}
          </label>
          <input
            type="email"
            required
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            placeholder={t('settings.contactEmailPlaceholder')}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Default Locale */}
        <div className="space-y-1.5">
          <label
            htmlFor="settings-default-locale"
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
          >
            {t('settings.defaultLocale')}
          </label>
          <NativeSelect
            id="settings-default-locale"
            value={formData.defaultLocale}
            onValueChange={(value) => setFormData({ ...formData, defaultLocale: value })}
            options={LOCALE_OPTIONS}
            className={SETTINGS_SELECT_CLASS}
          />
        </div>

        {/* Default Timezone */}
        <div className="space-y-1.5">
          <label
            htmlFor="settings-default-timezone"
            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
          >
            {t('settings.defaultTimezone')}
          </label>
          <NativeSelect
            id="settings-default-timezone"
            value={formData.defaultTimezone}
            onValueChange={(value) => setFormData({ ...formData, defaultTimezone: value })}
            options={TIMEZONE_OPTIONS}
            className={SETTINGS_SELECT_CLASS}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <RotateCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>{isSaving ? t('settings.saving') : t('settings.saveChanges')}</span>
        </button>
      </div>
    </form>
  );
}
