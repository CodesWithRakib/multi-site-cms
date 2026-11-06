'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Shield,
  Globe,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { NativeSelect } from '@multi-site-cms/ui';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useCreateUserMutation,
  useAssignRoleMutation,
  useListSitesQuery,
  useGetEffectivePolicyQuery,
} from '@/lib/cms-api';
import { roleScope, type AssignableRoleKey } from '@/features/users/roles';
import { apiErrorMessage } from '@/lib/api-error';

export default function NewUserPage() {
  const router = useRouter();
  const { t } = useAdmin();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [initialRole, setInitialRole] = useState<'none' | AssignableRoleKey>('admin');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: sitesData } = useListSitesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();
  const { data: policy } = useGetEffectivePolicyQuery();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    // Early hint only; the API enforces the platform password policy.
    const minLength = policy?.passwordMinLength ?? 8;
    if (password.length < minLength) {
      setErrorMsg(`Password must be at least ${minLength} characters long.`);
      return;
    }

    if (initialRole !== 'none' && roleScope(initialRole) === 'site' && !selectedSiteId) {
      setErrorMsg('Please select a site for site-scoped roles.');
      return;
    }

    let createdUserId: string | null = null;
    try {
      const createdUser = await createUser({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();
      createdUserId = createdUser.id;

      if (initialRole !== 'none') {
        const scope = roleScope(initialRole);
        await assignRole({
          userId: createdUser.id,
          data: {
            roleKey: initialRole,
            scopeType: scope,
            siteId: scope === 'site' ? selectedSiteId || undefined : undefined,
          },
        }).unwrap();
      }

      router.push(`/users/${createdUser.id}`);
    } catch (err: unknown) {
      setErrorMsg(
        createdUserId
          ? `The account was created, but the role could not be assigned: ${apiErrorMessage(err, 'unknown error')}. Assign it from the user page.`
          : apiErrorMessage(err, 'Failed to create the account.'),
      );
    }
  };

  return (
    <ShellLayout superAdminOnly>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-12">
        {/* Navigation & Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Link
            href="/users"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('users.createUser')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provision a new administrative account with role-scoped access controls.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* User Creation Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
        >
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('users.displayName')} *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('users.email')} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sjenkins@platform.internal"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t('users.password')} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters..."
                className="w-full pl-4 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Argon2id password hashing is applied on transmission.
            </p>
          </div>

          {/* Initial Role Assignment */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Initial Role Assignment
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialRole === 'super_admin'
                    ? 'border-purple-500 bg-purple-50/30 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="initialRole"
                  value="super_admin"
                  checked={initialRole === 'super_admin'}
                  onChange={() => setInitialRole('super_admin')}
                  className="mt-1 text-purple-600 dark:text-purple-400 focus:ring-purple-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-300">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Platform Super Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Unrestricted access to all sites, users, roles, and settings.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  initialRole === 'admin'
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="initialRole"
                  value="admin"
                  checked={initialRole === 'admin'}
                  onChange={() => setInitialRole('admin')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-300">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Site-Scoped Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Management restricted to a specific assigned publication website.
                  </p>
                </div>
              </label>
            </div>

            {/* Site Picker when site-scoped */}
            {initialRole !== 'super_admin' && initialRole !== 'none' && (
              <div>
                <label
                  htmlFor="new-user-site"
                  className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Assigned Site *
                </label>
                <NativeSelect
                  id="new-user-site"
                  required
                  value={selectedSiteId}
                  onValueChange={setSelectedSiteId}
                  placeholder="Select a target site..."
                  options={(sitesData ?? []).map((site) => ({
                    value: site.id,
                    label: `${site.name} (${site.key})`,
                  }))}
                  className="px-3 py-2 text-xs rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/users"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {t('actions.cancel')}
            </Link>
            <button
              type="submit"
              disabled={isCreating || isAssigning}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {isCreating || isAssigning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Create Administrator</span>
            </button>
          </div>
        </form>
      </div>
    </ShellLayout>
  );
}
