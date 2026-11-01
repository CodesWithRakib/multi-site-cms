'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Globe,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import type { SiteStatus } from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useAddDomainMutation,
  useDeleteDomainMutation,
  useGetSiteQuery,
  useGetVerificationChallengeQuery,
  useListDomainsQuery,
  useSetPrimaryDomainMutation,
  useUpdateSiteMutation,
  useVerifyDomainMutation,
} from '@/lib/cms-api';

export default function SiteDetailPage() {
  const params = useParams();
  const rawSiteId = params?.siteId;
  const siteId =
    typeof rawSiteId === 'string' ? rawSiteId : Array.isArray(rawSiteId) ? rawSiteId[0] || '' : '';
  const { t } = useAdmin();

  const [activeTab, setActiveTab] = useState<'general' | 'domains'>('general');

  // General state
  const [formData, setFormData] = useState<{
    name: string;
    timezone: string;
    defaultLocale: string;
    status: SiteStatus;
  } | null>(null);

  // Domain add state
  const [newHostname, setNewHostname] = useState('');
  const [isPrimaryDomain, setIsPrimaryDomain] = useState(false);

  // DNS Challenge modal
  const [challengeDomainId, setChallengeDomainId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Notification state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch site data
  const {
    data: site,
    isLoading: isLoadingSite,
    refetch: refetchSite,
  } = useGetSiteQuery(siteId, {
    skip: !siteId,
  });
  const { data: domains = [], refetch: refetchDomains } = useListDomainsQuery(siteId, {
    skip: !siteId,
  });

  // Mutations
  const [updateSite, { isLoading: isUpdatingSite }] = useUpdateSiteMutation();
  const [addDomain, { isLoading: isAddingDomain }] = useAddDomainMutation();
  const [setPrimaryDomain] = useSetPrimaryDomainMutation();
  const [deleteDomain] = useDeleteDomainMutation();
  const [verifyDomain, { isLoading: isVerifying }] = useVerifyDomainMutation();

  // Fetch challenge if domain selected
  const { data: challengeData } = useGetVerificationChallengeQuery(
    { siteId, domainId: challengeDomainId || '' },
    { skip: !challengeDomainId },
  );

  const currentName = formData?.name ?? site?.name ?? '';
  const currentTimezone = formData?.timezone ?? site?.timezone ?? 'UTC';
  const currentLocale = formData?.defaultLocale ?? site?.defaultLocale ?? 'en';
  const currentStatus = formData?.status ?? (site?.status as SiteStatus) ?? 'active';

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateSite({
        siteId,
        data: {
          name: currentName.trim(),
          timezone: currentTimezone,
          defaultLocale: currentLocale,
          status: currentStatus,
        },
      }).unwrap();
      setSuccessMsg('Site settings updated successfully.');
      refetchSite();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Failed to update site.');
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newHostname.trim()) return;

    try {
      await addDomain({
        siteId,
        data: {
          hostname: newHostname.trim(),
          isPrimary: isPrimaryDomain,
        },
      }).unwrap();

      setNewHostname('');
      setIsPrimaryDomain(false);
      setSuccessMsg('Domain binding added successfully.');
      refetchDomains();
      refetchSite();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Failed to add domain.');
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    try {
      await setPrimaryDomain({ siteId, domainId }).unwrap();
      refetchDomains();
      refetchSite();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert('Failed to set primary domain: ' + (errorObj?.message || 'Server error'));
    }
  };

  const handleDeleteDomain = async (domainId: string, hostname: string) => {
    if (confirm(`Remove domain binding "${hostname}"?`)) {
      try {
        await deleteDomain({ siteId, domainId }).unwrap();
        refetchDomains();
        refetchSite();
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        alert('Failed to remove domain: ' + (errorObj?.message || 'Cannot remove primary domain.'));
      }
    }
  };

  const handleVerify = async (domainId: string) => {
    try {
      await verifyDomain({ siteId, domainId }).unwrap();
      setSuccessMsg('Domain verified successfully!');
      refetchDomains();
      setChallengeDomainId(null);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert('Verification check failed: ' + (errorObj?.message || 'DNS record not yet detected.'));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoadingSite) {
    return (
      <ShellLayout superAdminOnly>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ShellLayout>
    );
  }

  if (!site) {
    return (
      <ShellLayout superAdminOnly>
        <div className="p-8 text-center text-xs text-slate-400">Site not found.</div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout superAdminOnly>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/sites"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {site.name}
                </h1>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {site.key}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Site ID: <span className="font-mono">{site.id}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'general'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('domains')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'domains'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Domains ({domains.length})
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  required
                  value={currentName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      name: e.target.value,
                      timezone: prev?.timezone ?? currentTimezone,
                      defaultLocale: prev?.defaultLocale ?? currentLocale,
                      status: prev?.status ?? currentStatus,
                    }))
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Timezone
                  </label>
                  <select
                    value={currentTimezone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        name: prev?.name ?? currentName,
                        timezone: e.target.value,
                        defaultLocale: prev?.defaultLocale ?? currentLocale,
                        status: prev?.status ?? currentStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Dhaka">Asia/Dhaka</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Default Locale
                  </label>
                  <select
                    value={currentLocale}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        name: prev?.name ?? currentName,
                        timezone: prev?.timezone ?? currentTimezone,
                        defaultLocale: e.target.value,
                        status: prev?.status ?? currentStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">Bangla (bn)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        name: prev?.name ?? currentName,
                        timezone: prev?.timezone ?? currentTimezone,
                        defaultLocale: prev?.defaultLocale ?? currentLocale,
                        status: e.target.value as SiteStatus,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isUpdatingSite}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isUpdatingSite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Domain Management */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            {/* Bound Domains List */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                Bound Hostnames
              </h3>

              {domains.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No domains bound to this site yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {domains.map((dom) => {
                    const isVerified = dom.verifiedAt !== null;

                    return (
                      <div
                        key={dom.id}
                        className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {dom.hostname}
                          </span>
                          {dom.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              Primary
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => setChallengeDomainId(dom.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                            >
                              DNS Instructions
                            </button>
                          )}

                          {!dom.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(dom.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            >
                              Make Primary
                            </button>
                          )}

                          {!dom.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(dom.id, dom.hostname)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Delete domain"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Domain Binding */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t.sites.addDomain}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Bind an alias or custom hostname to this site. Normalized automatically.
              </p>

              <form onSubmit={handleAddDomain} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value)}
                    placeholder={t.sites.hostname}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isPrimary"
                    type="checkbox"
                    checked={isPrimaryDomain}
                    onChange={(e) => setIsPrimaryDomain(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPrimary" className="text-xs text-slate-600 dark:text-slate-300">
                    Set as Primary Domain for this site
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAddingDomain}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isAddingDomain && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Add Domain</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DNS Challenge Modal */}
        {challengeDomainId && challengeData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Domain DNS Verification Challenge</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setChallengeDomainId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">{t.sites.dnsInstructions}</p>

              <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Record Type
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100">TXT</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Host / Name
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                    {challengeData.recordName}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Record Value
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="font-mono font-bold text-blue-600 dark:text-blue-400 break-all">
                      {challengeData.recordValue}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(challengeData.recordValue)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 shrink-0"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setChallengeDomainId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(challengeData.domainId)}
                  disabled={isVerifying}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Verify DNS Record</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
