'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCw, AlertTriangle } from 'lucide-react';
import type { PlatformMaintenanceSettings } from '@multi-site-cms/types';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';
import { useAdmin } from '@/lib/admin-context';
import { SETTINGS_SELECT_CLASS } from './form-styles';

/** Audit history is kept at least a year (enforced by the API). */
const RETENTION_OPTIONS: NativeSelectOption[] = [
  { value: '365', label: '365 Days (1 Year minimum)' },
  { value: '730', label: '730 Days (2 Years, default)' },
  { value: '1095', label: '1095 Days (3 Years)' },
  { value: '1825', label: '1825 Days (5 Years)' },
];

interface MaintenanceSettingsFormProps {
  initialData?: PlatformMaintenanceSettings;
  onSave: (data: PlatformMaintenanceSettings) => Promise<boolean>;
  isSaving: boolean;
}

export function MaintenanceSettingsForm({
  initialData,
  onSave,
  isSaving,
}: MaintenanceSettingsFormProps) {
  const { t } = useAdmin();

  const [formData, setFormData] = useState<PlatformMaintenanceSettings>({
    maintenanceMode: initialData?.maintenanceMode ?? false,
    maintenanceNoticeEn:
      initialData?.maintenanceNoticeEn ??
      'The platform is currently undergoing scheduled maintenance. Please check back shortly.',
    maintenanceNoticeBn:
      initialData?.maintenanceNoticeBn ??
      'প্ল্যাটফর্মটি বর্তমানে নির্ধারিত রক্ষণাবেক্ষণের আওতায় রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    auditRetentionDays: initialData?.auditRetentionDays ?? 730,
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
          {t('settings.maintenanceTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.maintenanceDesc')}
        </p>
      </div>

      {formData.maintenanceMode && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-bold">Maintenance Mode is Active!</p>
            <p>{t('settings.maintenanceModeNotice')}</p>
          </div>
        </div>
      )}

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

      {/* Maintenance Mode Toggle Switch */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.maintenanceMode}
            onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
            className="size-5 mt-0.5 text-rose-600 dark:text-rose-400 rounded-md border-neutral-300 focus:ring-rose-500"
          />
          <div>
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {t('settings.maintenanceMode')}
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('settings.maintenanceModeNotice')}
            </p>
          </div>
        </label>
      </div>

      {/* Notice in English */}
      <div className="space-y-1.5 text-sm">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {t('settings.maintenanceNoticeEn')}
        </label>
        <textarea
          rows={3}
          value={formData.maintenanceNoticeEn}
          onChange={(e) => setFormData({ ...formData, maintenanceNoticeEn: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
        />
      </div>

      {/* Notice in Bangla */}
      <div className="space-y-1.5 text-sm">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {t('settings.maintenanceNoticeBn')}
        </label>
        <textarea
          rows={3}
          value={formData.maintenanceNoticeBn}
          onChange={(e) => setFormData({ ...formData, maintenanceNoticeBn: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
        />
      </div>

      {/* Audit retention days */}
      <div className="space-y-1.5 text-sm">
        <label
          htmlFor="settings-audit-retention"
          className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
        >
          {t('settings.auditRetentionDays')}
        </label>
        <NativeSelect
          id="settings-audit-retention"
          value={String(formData.auditRetentionDays)}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              auditRetentionDays: Number.parseInt(value, 10) || 730,
            })
          }
          options={RETENTION_OPTIONS}
          className={SETTINGS_SELECT_CLASS}
        />
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
