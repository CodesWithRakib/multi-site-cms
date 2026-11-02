'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCw, Cloud } from 'lucide-react';
import type { PlatformMediaSettings } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface MediaSettingsFormProps {
  initialData?: PlatformMediaSettings;
  onSave: (data: PlatformMediaSettings) => Promise<boolean>;
  isSaving: boolean;
}

export function MediaSettingsForm({
  initialData,
  onSave,
  isSaving,
}: MediaSettingsFormProps) {
  const { t } = useAdmin();

  const [formData, setFormData] = useState<PlatformMediaSettings>({
    storageProvider: initialData?.storageProvider ?? 'cloudinary',
    maxUploadSizeBytes: initialData?.maxUploadSizeBytes ?? 10485760,
    allowedMimeTypes: initialData?.allowedMimeTypes ?? [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'application/pdf',
    ],
    autoWebpConversion: initialData?.autoWebpConversion ?? true,
  });

  const [mimeString, setMimeString] = useState(formData.allowedMimeTypes.join(', '));

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    const mimes = mimeString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const success = await onSave({ ...formData, allowedMimeTypes: mimes });
    if (success) {
      setStatusMessage({ type: 'success', text: t('settings.savedSuccess') });
      setTimeout(() => setStatusMessage(null), 3500);
    } else {
      setStatusMessage({ type: 'error', text: t('settings.saveError') });
    }
  };

  const maxMb = Math.round(formData.maxUploadSizeBytes / (1024 * 1024));

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
          {t('settings.mediaTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.mediaDesc')}
        </p>
      </div>

      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-800 dark:text-cyan-300">
        <Cloud className="size-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span>{t('settings.cloudinaryConfigured')}</span>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2 p-3 text-xs font-medium rounded-xl border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
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
        {/* Storage Provider */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.storageProvider')}
          </label>
          <select
            value={formData.storageProvider}
            onChange={(e) =>
              setFormData({
                ...formData,
                storageProvider: e.target.value as 'cloudinary' | 'local' | 's3',
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
          >
            <option value="cloudinary">Cloudinary CDN (Recommended)</option>
            <option value="local">Local Filesystem</option>
            <option value="s3">Amazon S3 / Compatible Object Storage</option>
          </select>
        </div>

        {/* Max Upload Size (MB) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.maxUploadSizeMb')}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={maxMb}
            onChange={(e) => {
              const mb = Number.parseInt(e.target.value, 10) || 10;
              setFormData({ ...formData, maxUploadSizeBytes: mb * 1024 * 1024 });
            }}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>

        {/* Permitted MIME types */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.allowedMimeTypes')}
          </label>
          <input
            type="text"
            value={mimeString}
            onChange={(e) => setMimeString(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono text-xs"
          />
        </div>
      </div>

      {/* Auto WebP conversion toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.autoWebpConversion}
            onChange={(e) => setFormData({ ...formData, autoWebpConversion: e.target.checked })}
            className="size-4 text-emerald-600 rounded-md border-neutral-300 focus:ring-emerald-500"
          />
          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            {t('settings.autoWebpConversion')}
          </span>
        </label>
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
