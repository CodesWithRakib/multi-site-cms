'use client';

import React, { useState } from 'react';
import { X, UserPlus, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useCreateUserMutation, useAssignRoleMutation } from '@/lib/cms-api';
import { useAdmin } from '@/lib/admin-context';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';

const MODAL_SELECT_CLASS =
  'px-3.5 py-2 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500';

const CREATE_ROLE_OPTIONS: NativeSelectOption[] = [
  { value: 'super_admin', label: 'Platform Super Admin (Global Access)' },
  { value: 'admin', label: 'Site Admin (Full site control)' },
];

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sites: Array<{ id: string; name: string }>;
}

export function CreateUserModal({ isOpen, onClose, onCreated, sites }: CreateUserModalProps) {
  const { t } = useAdmin();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleKey, setRoleKey] = useState<string>('admin');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();

  if (!isOpen) return null;

  const isPlatformRole = roleKey === 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (!isPlatformRole && !selectedSiteId) {
      setErrorMsg('Please select a website for site-scoped roles.');
      return;
    }

    try {
      const createdUser = await createUser({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();

      // Assign initial role
      await assignRole({
        userId: createdUser.id,
        data: {
          roleKey,
          scopeType: isPlatformRole ? 'platform' : 'site',
          siteId: isPlatformRole ? undefined : selectedSiteId || undefined,
        },
      }).unwrap();

      setSuccessMsg(t.users.userCreatedSuccess || 'User created successfully!');
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(
        apiErr?.data?.error?.message ||
          apiErr?.message ||
          'Failed to create user. Ensure email is unique.',
      );
    }
  };

  const isSubmitting = isCreating || isAssigning;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.users.createUser || 'Create Administrator'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add an administrator with role-based permissions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300">
              <span>{successMsg}</span>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.users.displayName || 'Display Name'} *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.users.email || 'Email Address'} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.users.password || 'Initial Password'} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-3.5 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label
              htmlFor="create-user-role"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.users.selectRole || 'Role Permission'}
            </label>
            <NativeSelect
              id="create-user-role"
              value={roleKey}
              onValueChange={setRoleKey}
              options={CREATE_ROLE_OPTIONS}
              className={MODAL_SELECT_CLASS}
            />
          </div>

          {/* Site Selection (if not super admin) */}
          {!isPlatformRole && (
            <div>
              <label
                htmlFor="create-user-site"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Assigned Website *
              </label>
              <NativeSelect
                id="create-user-site"
                value={selectedSiteId}
                onValueChange={setSelectedSiteId}
                options={sites.map((s) => ({ value: s.id, label: s.name }))}
                className={MODAL_SELECT_CLASS}
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {t.users.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t.users.createUser || 'Create Administrator'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
