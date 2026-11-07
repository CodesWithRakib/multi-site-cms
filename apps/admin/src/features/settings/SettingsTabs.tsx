'use client';

import React from 'react';
import { Globe, ShieldAlert, HardDrive, FileCheck2, Wrench, Activity } from 'lucide-react';
import { useAdmin } from '@/lib/admin-context';

export type SettingsTabId =
  'general' | 'security' | 'media' | 'publishing' | 'maintenance' | 'diagnostics';

interface SettingsTabsProps {
  activeTab: SettingsTabId;
  onSelectTab: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ activeTab, onSelectTab }: SettingsTabsProps) {
  const { t } = useAdmin();

  const tabs: Array<{ id: SettingsTabId; label: string; icon: React.ElementType }> = [
    { id: 'general', label: t('settings.tabGeneral'), icon: Globe },
    { id: 'security', label: t('settings.tabSecurity'), icon: ShieldAlert },
    { id: 'media', label: t('settings.tabMedia'), icon: HardDrive },
    { id: 'publishing', label: t('settings.tabPublishing'), icon: FileCheck2 },
    { id: 'maintenance', label: t('settings.tabMaintenance'), icon: Wrench },
    { id: 'diagnostics', label: t('settings.tabDiagnostics'), icon: Activity },
  ];

  return (
    <div className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl p-1.5 shadow-2xs">
      <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Settings Tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <IconComponent className={`size-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
