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
  Save,
  Radio,
  ExternalLink,
  Settings,
  Plus,
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
  const [copiedHost, setCopiedHost] = useState(false);
  const [copiedValue, setCopiedValue] = useState(false);

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

  const copyToClipboard = (text: string, type: 'host' | 'value') => {
    navigator.clipboard.writeText(text);
    if (type === 'host') {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    } else {
      setCopiedValue(true);
      setTimeout(() => setCopiedValue(false), 2000);
    }
  };

  if (isLoadingSite) {
    return (
      <ShellLayout superAdminOnly>
        <div className="flex h-96 flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-500" />
          <p className="text-xs font-semibold text-slate-400">Loading website configuration...</p>
        </div>
      </ShellLayout>
    );
  }

  if (!site) {
    return (
      <ShellLayout superAdminOnly>
        <div className="p-12 text-center text-xs text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          Site configuration could not be loaded.
        </div>
      </ShellLayout>
    );
  }

  const primaryDomain = domains.find((d) => d.isPrimary) || domains[0];
  const liveUrl = primaryDomain?.hostname
    ? `http://${primaryDomain.hostname}:3000`
    : `https://${site.key}.yourdomain.com`;

  return (
    <ShellLayout superAdminOnly>
      <div className="w-full space-y-6 pb-12">
        {/* 1. Sticky Frosted Header */}
        <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/sites"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
              title={t.sites.backToSites || 'Back to Websites'}
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {site.name}
                </h1>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {site.key}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    site.status === 'active'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  <span className="capitalize">{site.status}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Site ID: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{site.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Visit Live Website */}
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-500 hover:border-emerald-300 text-xs font-semibold shadow-2xs transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>{t.sites.visitSite || 'Live Website'}</span>
            </a>

            {/* Quick Tab Switcher */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'general'
                    ? 'bg-white dark:bg-slate-700 text-[#072423] dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.sites.generalSettings || 'General'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('domains')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'domains'
                    ? 'bg-white dark:bg-slate-700 text-[#072423] dark:text-emerald-400 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.sites.manageDomains || 'Domains'} ({domains.length})
              </button>
            </div>
          </div>
        </div>

        {/* 2. Notifications */}
        {successMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 shadow-2xs">
            <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* 3. Tab 1: General Settings */}
        {activeTab === 'general' && (
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Settings className="size-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.sites.generalSettings || 'General Tenant Configuration'}
                </h3>
                <p className="text-xs text-slate-400">
                  Manage display name, default editorial language, timezone, and operational state.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGeneral} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.sites.siteName || 'Site Name'}
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
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.sites.timezone || 'Timezone'}
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
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  >
                    <option value="UTC">UTC (Universal Coordinated)</option>
                    <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Paris">Europe/Paris (CET)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.sites.defaultLocale || 'Default Locale'}
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
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  >
                    <option value="en">English (en)</option>
                    <option value="bn">Bangla (bn)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Operational Status
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
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  >
                    <option value="active">Active (Serving traffic)</option>
                    <option value="paused">Paused (Under Maintenance)</option>
                    <option value="suspended">Suspended (Access Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isUpdatingSite}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingSite ? (
                    <Loader2 className="size-4 animate-spin text-[#072423]" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Tab 2: Domain Management & DNS */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            {/* Bound Domains List */}
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <Radio className="size-5 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Bound Hostnames & Domains
                    </h3>
                    <p className="text-xs text-slate-400">
                      All custom hostnames mapped to this website tenant across the edge network.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {domains.length} {domains.length === 1 ? 'Domain' : 'Domains'}
                </span>
              </div>

              {domains.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No domains bound to this site yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {domains.map((dom) => {
                    const isVerified = dom.verifiedAt !== null;

                    return (
                      <div
                        key={dom.id}
                        className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="size-4 text-slate-400" />
                          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {dom.hostname}
                          </span>
                          {dom.isPrimary && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Primary
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <CheckCircle2 className="size-3 text-emerald-500" />
                                <span>Verified</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="size-3 text-amber-500" />
                                <span>Pending DNS</span>
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => setChallengeDomainId(dom.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 transition-colors cursor-pointer"
                            >
                              DNS Instructions
                            </button>
                          )}

                          {!dom.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(dom.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}

                          {!dom.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(dom.id, dom.hostname)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                              title="Delete domain"
                            >
                              <Trash2 className="size-4" />
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
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t.sites.addDomain || 'Add Domain Binding'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Bind an alias or custom hostname to this site. Domains are normalized automatically.
              </p>

              <form onSubmit={handleAddDomain} className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value)}
                    placeholder={t.sites.hostname || 'Domain Hostname (e.g. news.airsports.org)'}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 font-mono shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    id="isPrimary"
                    type="checkbox"
                    checked={isPrimaryDomain}
                    onChange={(e) => setIsPrimaryDomain(e.target.checked)}
                    className="size-4 rounded-md border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-400/20"
                  />
                  <label htmlFor="isPrimary" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Set as Primary Domain for this website
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAddingDomain}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isAddingDomain ? (
                      <Loader2 className="size-4 animate-spin text-[#072423]" />
                    ) : (
                      <Plus className="size-4 stroke-[2.5]" />
                    )}
                    <span>Add Domain Binding</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. DNS Challenge Modal */}
        {challengeDomainId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="size-4 text-emerald-500" />
                  <span>{t.sites.dnsChallenge || 'Domain DNS Verification Challenge'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setChallengeDomainId(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {!challengeData ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2.5">
                  <Loader2 className="size-6 animate-spin text-emerald-500" />
                  <p className="text-xs text-slate-400">Loading DNS challenge records...</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t.sites.dnsInstructions}</p>

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
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all">
                          {challengeData.recordName}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(challengeData.recordName, 'host')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 shrink-0 cursor-pointer"
                          title="Copy host name"
                        >
                          {copiedHost ? (
                            <Check className="size-4 text-emerald-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">
                        Record Value
                      </span>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 break-all">
                          {challengeData.recordValue}
                        </p>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(challengeData.recordValue, 'value')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 shrink-0 cursor-pointer"
                          title="Copy challenge value"
                        >
                          {copiedValue ? (
                            <Check className="size-4 text-emerald-500" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 mt-5">
                    <button
                      type="button"
                      onClick={() => setChallengeDomainId(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(challengeData.domainId)}
                      disabled={isVerifying}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifying && <Loader2 className="size-3.5 animate-spin text-[#072423]" />}
                      <span>Verify DNS Record Now</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
