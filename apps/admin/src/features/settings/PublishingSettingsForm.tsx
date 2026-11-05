'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';
import type { PlatformPublishingSettings } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface PublishingSettingsFormProps {
  initialData?: PlatformPublishingSettings;
  onSave: (data: PlatformPublishingSettings) => Promise<boolean>;
  isSaving: boolean;
}

export function PublishingSettingsForm({
  initialData,
  onSave,
  isSaving,
}: PublishingSettingsFormProps) {
  const { t } = useAdmin();

  const [formData, setFormData] = useState<PlatformPublishingSettings>({
    defaultPostStatus: initialData?.defaultPostStatus ?? 'draft',
    autoSaveIntervalSeconds: initialData?.autoSaveIntervalSeconds ?? 30,
    maxRevisionHistory: initialData?.maxRevisionHistory ?? 25,
    previewTokenTtlMinutes: initialData?.previewTokenTtlMinutes ?? 60,
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
          {t('settings.publishingTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.publishingDesc')}
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
        {/* Default Post Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.defaultPostStatus')}
          </label>
          <select
            value={formData.defaultPostStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                defaultPostStatus: e.target.value as 'draft' | 'in_review',
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            <option value="draft">Draft (Private author workspace)</option>
            <option value="in_review">In Review (Direct editorial review queue)</option>
          </select>
        </div>

        {/* Auto Save Interval */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.autoSaveIntervalSeconds')}
          </label>
          <input
            type="number"
            min={5}
            max={300}
            required
            value={formData.autoSaveIntervalSeconds}
            onChange={(e) =>
              setFormData({
                ...formData,
                autoSaveIntervalSeconds: Number.parseInt(e.target.value, 10) || 30,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Max Revision History */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.maxRevisionHistory')}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={formData.maxRevisionHistory}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxRevisionHistory: Number.parseInt(e.target.value, 10) || 25,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Preview Token TTL */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.previewTokenTtlMinutes')}
          </label>
          <input
            type="number"
            min={5}
            max={1440}
            required
            value={formData.previewTokenTtlMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                previewTokenTtlMinutes: Number.parseInt(e.target.value, 10) || 60,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
