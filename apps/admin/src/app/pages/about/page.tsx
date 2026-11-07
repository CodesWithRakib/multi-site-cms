'use client';

import React from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { NativeSelect } from '@multi-site-cms/ui';
import type { SiteAbout } from '@multi-site-cms/types';

import { ActionNotice, useActionNotice } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { AboutForm } from '@/features/about';
import { useAdmin } from '@/lib/admin-context';
import { apiErrorMessage } from '@/lib/api-error';
import { useUpdateSiteAboutMutation } from '@/lib/cms-api';

export default function AboutPageEditor() {
  const { activeSiteId, activeSite, availableSites, setActiveSiteId, can } = useAdmin();
  const siteId = activeSiteId ?? '';
  const canEdit = Boolean(siteId) && can('site:update_settings', siteId);
  const notices = useActionNotice();
  const [updateAbout, { isLoading: isSaving }] = useUpdateSiteAboutMutation();

  const handleSave = async (about: SiteAbout) => {
    try {
      await updateAbout({ siteId, data: about }).unwrap();
      notices.success('About page saved. It appears on the website within a few minutes.');
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Could not save the About page.'));
    }
  };

  return (
    <ShellLayout>
      <div className="w-full max-w-4xl space-y-6 pb-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">About page</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              The text visitors read on your About page. Anything left empty falls back to a neutral
              default.
            </p>
          </div>
          {availableSites.length > 1 && (
            <NativeSelect
              id="about-site-scope"
              aria-label="Website"
              value={siteId}
              onValueChange={setActiveSiteId}
              options={availableSites.map((site) => ({ value: site.id, label: site.name }))}
              className="w-auto rounded-xl border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          )}
        </header>

        <ActionNotice notice={notices.notice} onDismiss={notices.dismiss} />

        {!activeSite ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 p-12 text-sm text-slate-500 dark:border-slate-800">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading website…
          </div>
        ) : (
          <>
            {!canEdit && (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                You can view this page but only the website owner can change it.
              </div>
            )}
            {/* Remounts on site switch or after a save so the form re-reads stored content. */}
            <AboutForm
              key={`${activeSite.id}:${activeSite.updatedAt}`}
              initial={activeSite.settings.about}
              isSaving={isSaving}
              disabled={!canEdit}
              onSave={handleSave}
            />
          </>
        )}
      </div>
    </ShellLayout>
  );
}
