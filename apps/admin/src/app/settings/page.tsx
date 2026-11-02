'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import type {
  PlatformGeneralSettings,
  PlatformMaintenanceSettings,
  PlatformMediaSettings,
  PlatformPublishingSettings,
  PlatformSecuritySettings,
} from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetPlatformDiagnosticsQuery,
} from '@/lib/cms-api';
import {
  SettingsTabs,
  type SettingsTabId,
  GeneralSettingsForm,
  SecuritySettingsForm,
  MediaSettingsForm,
  PublishingSettingsForm,
  MaintenanceSettingsForm,
  SystemDiagnosticsCard,
} from '@/features/settings';

export default function SettingsPage() {
  const { t } = useAdmin();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

  const { data: settingsData, isLoading: isSettingsLoading } = useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdatePlatformSettingsMutation();

  const {
    data: diagnosticsData,
    isLoading: isDiagnosticsLoading,
    isFetching: isDiagnosticsFetching,
    refetch: refetchDiagnostics,
  } = useGetPlatformDiagnosticsQuery();

  const handleSaveGeneral = async (general: PlatformGeneralSettings) => {
    try {
      await updateSettings({ general }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveSecurity = async (security: PlatformSecuritySettings) => {
    try {
      await updateSettings({ security }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveMedia = async (media: PlatformMediaSettings) => {
    try {
      await updateSettings({ media }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const handleSavePublishing = async (publishing: PlatformPublishingSettings) => {
    try {
      await updateSettings({ publishing }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveMaintenance = async (maintenance: PlatformMaintenanceSettings) => {
    try {
      await updateSettings({ maintenance }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
              <SettingsIcon className="size-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              {t('settings.title')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <ShieldCheck className="size-3" />
              <span>Super Admin Governance</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Tab Selector */}
        <SettingsTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Tab Content Panels */}
        {isSettingsLoading ? (
          <div className="p-12 text-center text-sm text-neutral-400 animate-pulse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            Loading platform settings...
          </div>
        ) : (
          <div className="w-full">
            {activeTab === 'general' && (
              <GeneralSettingsForm
                initialData={settingsData?.general}
                onSave={handleSaveGeneral}
                isSaving={isUpdating}
              />
            )}

            {activeTab === 'security' && (
              <SecuritySettingsForm
                initialData={settingsData?.security}
                onSave={handleSaveSecurity}
                isSaving={isUpdating}
              />
            )}

            {activeTab === 'media' && (
              <MediaSettingsForm
                initialData={settingsData?.media}
                onSave={handleSaveMedia}
                isSaving={isUpdating}
              />
            )}

            {activeTab === 'publishing' && (
              <PublishingSettingsForm
                initialData={settingsData?.publishing}
                onSave={handleSavePublishing}
                isSaving={isUpdating}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceSettingsForm
                initialData={settingsData?.maintenance}
                onSave={handleSaveMaintenance}
                isSaving={isUpdating}
              />
            )}

            {activeTab === 'diagnostics' && (
              <SystemDiagnosticsCard
                diagnostics={diagnosticsData}
                isLoading={isDiagnosticsLoading}
                onRefresh={refetchDiagnostics}
                isRefreshing={isDiagnosticsFetching}
              />
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

