'use client';

import { useState } from 'react';
import type { SiteDomainItem, SiteStatus } from '@multi-site-cms/types';

import { useActionNotice } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useAddDomainMutation,
  useDeleteDomainMutation,
  useGetSiteQuery,
  useListDomainsQuery,
  useSetPrimaryDomainMutation,
  useUpdateSiteMutation,
  useVerifyDomainMutation,
} from '@/lib/cms-api';

import { primaryDomainUrl } from '../utils/site-url';

export interface SiteGeneralValues {
  name: string;
  timezone: string;
  defaultLocale: string;
  status: SiteStatus;
}

export type SiteDetailTab = 'general' | 'domains';

/**
 * State, data, and actions of the site detail screen. The page only composes
 * presentation components around this hook.
 */
export function useSiteDetail(siteId: string) {
  const [activeTab, setActiveTab] = useState<SiteDetailTab>('general');
  const [challengeDomainId, setChallengeDomainId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<SiteDomainItem | null>(null);
  const notices = useActionNotice();

  const siteQuery = useGetSiteQuery(siteId, { skip: !siteId });
  const { data: domains = [] } = useListDomainsQuery(siteId, { skip: !siteId });

  const [updateSite, { isLoading: isSavingGeneral }] = useUpdateSiteMutation();
  const [addDomain, { isLoading: isAddingDomain }] = useAddDomainMutation();
  const [setPrimaryDomain] = useSetPrimaryDomainMutation();
  const [deleteDomain, { isLoading: isRemovingDomain }] = useDeleteDomainMutation();
  const [verifyDomain, { isLoading: isVerifying }] = useVerifyDomainMutation();

  const site = siteQuery.data;

  const saveGeneral = async (values: SiteGeneralValues): Promise<void> => {
    try {
      await updateSite({
        siteId,
        data: { ...values, name: values.name.trim() },
      }).unwrap();
      notices.success('Site settings updated.');
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to update the site.'));
    }
  };

  /** Resolves true when the domain was added (so the form can reset). */
  const addDomainBinding = async (hostname: string, isPrimary: boolean): Promise<boolean> => {
    try {
      await addDomain({ siteId, data: { hostname: hostname.trim(), isPrimary } }).unwrap();
      notices.success(`Domain ${hostname.trim()} added. Verify it with the DNS instructions.`);
      return true;
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to add the domain.'));
      return false;
    }
  };

  const makePrimary = async (domain: SiteDomainItem): Promise<void> => {
    try {
      await setPrimaryDomain({ siteId, domainId: domain.id }).unwrap();
      notices.success(`${domain.hostname} is now the primary domain.`);
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to set the primary domain.'));
    }
  };

  const confirmRemoval = async (): Promise<void> => {
    if (!pendingRemoval) return;
    try {
      await deleteDomain({ siteId, domainId: pendingRemoval.id }).unwrap();
      notices.success(`Removed ${pendingRemoval.hostname}.`);
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to remove the domain.'));
    } finally {
      setPendingRemoval(null);
    }
  };

  const verify = async (domainId: string): Promise<void> => {
    try {
      await verifyDomain({ siteId, domainId }).unwrap();
      notices.success('Domain verified.');
      setChallengeDomainId(null);
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'The DNS record was not found yet. Try again later.'));
    }
  };

  return {
    site,
    isLoading: siteQuery.isLoading,
    domains,
    liveUrl: primaryDomainUrl(domains),
    activeTab,
    setActiveTab,
    notice: notices.notice,
    dismissNotice: notices.dismiss,
    saveGeneral,
    isSavingGeneral,
    addDomainBinding,
    isAddingDomain,
    makePrimary,
    requestRemoval: setPendingRemoval,
    pendingRemoval,
    cancelRemoval: () => setPendingRemoval(null),
    confirmRemoval,
    isRemovingDomain,
    challengeDomainId,
    openChallenge: setChallengeDomainId,
    closeChallenge: () => setChallengeDomainId(null),
    verify,
    isVerifying,
  };
}

export type SiteDetail = ReturnType<typeof useSiteDetail>;
