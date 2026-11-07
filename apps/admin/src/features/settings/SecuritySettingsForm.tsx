'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2, AlertCircle, RotateCw, ShieldCheck } from 'lucide-react';
import type { PlatformSecuritySettings } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

interface SecuritySettingsFormProps {
  initialData?: PlatformSecuritySettings;
  onSave: (data: PlatformSecuritySettings) => Promise<boolean>;
  isSaving: boolean;
}

export function SecuritySettingsForm({ initialData, onSave, isSaving }: SecuritySettingsFormProps) {
  const { t } = useAdmin();

  const [formData, setFormData] = useState<PlatformSecuritySettings>({
    sessionTtlHours: initialData?.sessionTtlHours ?? 168,
    maxLoginAttempts: initialData?.maxLoginAttempts ?? 5,
    lockoutDurationMinutes: initialData?.lockoutDurationMinutes ?? 15,
    passwordMinLength: initialData?.passwordMinLength ?? 8,
    requireStrongPasswords: initialData?.requireStrongPasswords ?? true,
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
          {t('settings.securityTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.securityDesc')}
        </p>
      </div>

      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
        <ShieldCheck className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>{t('settings.activePolicyNotice')}</span>
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
        {/* Session Lifetime */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.sessionTtlHours')}
          </label>
          <input
            type="number"
            min={1}
            max={720}
            required
            value={formData.sessionTtlHours}
            onChange={(e) =>
              setFormData({
                ...formData,
                sessionTtlHours: Number.parseInt(e.target.value, 10) || 168,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Max Login Attempts */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.maxLoginAttempts')}
          </label>
          <input
            type="number"
            min={1}
            max={20}
            required
            value={formData.maxLoginAttempts}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxLoginAttempts: Number.parseInt(e.target.value, 10) || 5,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Lockout Duration */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.lockoutDurationMinutes')}
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            required
            value={formData.lockoutDurationMinutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                lockoutDurationMinutes: Number.parseInt(e.target.value, 10) || 15,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>

        {/* Password Min Length */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            {t('settings.passwordMinLength')}
          </label>
          <input
            type="number"
            min={8}
            max={64}
            required
            value={formData.passwordMinLength}
            onChange={(e) =>
              setFormData({
                ...formData,
                passwordMinLength: Number.parseInt(e.target.value, 10) || 8,
              })
            }
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Security Checkbox Toggles */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requireStrongPasswords}
            onChange={(e) => setFormData({ ...formData, requireStrongPasswords: e.target.checked })}
            className="size-4 text-emerald-600 dark:text-emerald-400 rounded-md border-neutral-300 focus:ring-emerald-500"
          />
          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
            {t('settings.requireStrongPasswords')}
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
