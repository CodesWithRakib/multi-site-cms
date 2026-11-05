'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { ActionNotice, ConfirmDialog } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { AddDomainForm } from '@/features/sites/components/AddDomainForm';
import { DnsChallengeDialog } from '@/features/sites/components/DnsChallengeDialog';
import { SiteDetailHeader } from '@/features/sites/components/SiteDetailHeader';
import { SiteDomainsPanel } from '@/features/sites/components/SiteDomainsPanel';
import { SiteGeneralForm } from '@/features/sites/components/SiteGeneralForm';
import { useSiteDetail } from '@/features/sites/hooks/useSiteDetail';

/**
 * Site detail: orchestration only. State and actions live in useSiteDetail;
 * each section is a component in features/sites.
 */
export default function SiteDetailPage() {
  const params = useParams();
  const raw = params?.siteId;
  const siteId = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';
  const detail = useSiteDetail(siteId);
  const { site } = detail;

  if (detail.isLoading) {
    return (
      <ShellLayout superAdminOnly>
        <div className="flex h-96 flex-col items-center justify-center gap-3" role="status">
          <Loader2 className="size-8 animate-spin text-emerald-600" aria-hidden="true" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading website configuration…
          </p>
        </div>
      </ShellLayout>
    );
  }

  if (!site) {
    return (
      <ShellLayout superAdminOnly>
        <p
          role="alert"
          className="p-12 text-center text-xs text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
        >
          Site configuration could not be loaded.
        </p>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout superAdminOnly>
      <div className="w-full space-y-6 pb-12">
        <SiteDetailHeader
          site={site}
          liveUrl={detail.liveUrl}
          domainCount={detail.domains.length}
          activeTab={detail.activeTab}
          onTabChange={detail.setActiveTab}
        />

        <ActionNotice notice={detail.notice} onDismiss={detail.dismissNotice} />

        {detail.activeTab === 'general' ? (
          <SiteGeneralForm
            key={site.updatedAt}
            site={site}
            isSaving={detail.isSavingGeneral}
            onSave={detail.saveGeneral}
          />
        ) : (
          <div className="space-y-6">
            <SiteDomainsPanel
              domains={detail.domains}
              onShowDns={detail.openChallenge}
              onMakePrimary={(domain) => void detail.makePrimary(domain)}
              onRemove={detail.requestRemoval}
            />
            <AddDomainForm isAdding={detail.isAddingDomain} onAdd={detail.addDomainBinding} />
          </div>
        )}
      </div>

      <DnsChallengeDialog
        siteId={siteId}
        domainId={detail.challengeDomainId}
        isVerifying={detail.isVerifying}
        onVerify={(domainId) => void detail.verify(domainId)}
        onClose={detail.closeChallenge}
      />

      <ConfirmDialog
        open={detail.pendingRemoval !== null}
        title="Remove this domain?"
        description={`${detail.pendingRemoval?.hostname ?? ''} will stop serving this website. Visitors using it will no longer reach the site.`}
        confirmLabel="Remove domain"
        busyLabel="Removing…"
        isBusy={detail.isRemovingDomain}
        onConfirm={() => void detail.confirmRemoval()}
        onCancel={detail.cancelRemoval}
      />
    </ShellLayout>
  );
}
