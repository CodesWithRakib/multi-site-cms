'use client';

import React, { useState } from 'react';
import { X, Edit2, Shield, Globe, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { UserItem, UserStatus } from '@multi-site-cms/types';
import { useUpdateUserMutation, useAssignRoleMutation, useRevokeRoleMutation } from '@/lib/cms-api';
import { useAdmin } from '@/lib/admin-context';
import { ConfirmDialog } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import { NativeSelect, type NativeSelectOption } from '@multi-site-cms/ui';

import { STATUS_SELECT_OPTIONS, toUserStatus } from '../roles';

const INLINE_SELECT_CLASS =
  'px-2.5 py-1.5 text-xs rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200';

const ADD_ROLE_OPTIONS: NativeSelectOption[] = [
  { value: 'super_admin', label: 'Super Admin (Platform)' },
  { value: 'admin', label: 'Site Admin' },
];

export interface EditUserModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  sites: Array<{ id: string; name: string }>;
  superAdminCount: number;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onUpdated,
  sites,
  superAdminCount,
}: EditUserModalProps) {
  const { t } = useAdmin();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [status, setStatus] = useState<UserStatus>(user?.status || 'active');
  const [newPassword, setNewPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New role assignment state
  const [showAddRole, setShowAddRole] = useState(false);
  const [roleKey, setRoleKey] = useState<string>('admin');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id || '');
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();
  const [revokeRole, { isLoading: isRevoking }] = useRevokeRoleMutation();

  if (!isOpen || !user) return null;

  const isSuper = user.roles.some((r) => r.roleKey === 'super_admin' || r.scopeType === 'platform');
  const isDeactivationLocked = isSuper && user.status === 'active' && superAdminCount <= 1;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!displayName.trim()) {
      setErrorMsg('Display name is required.');
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters.');
      return;
    }

    try {
      await updateUser({
        userId: user.id,
        data: {
          displayName: displayName.trim(),
          status,
          ...(newPassword ? { password: newPassword } : {}),
        },
      }).unwrap();

      setSuccessMsg(t.users.userUpdatedSuccess || 'User updated successfully!');
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(apiErrorMessage(err, 'Failed to update user.'));
    }
  };

  const handleAssignRole = async () => {
    setErrorMsg(null);
    const isPlatform = roleKey === 'super_admin';
    if (!isPlatform && !selectedSiteId) {
      setErrorMsg('Please select a website for site-scoped role.');
      return;
    }

    try {
      await assignRole({
        userId: user.id,
        data: {
          roleKey,
          scopeType: isPlatform ? 'platform' : 'site',
          siteId: isPlatform ? undefined : selectedSiteId || undefined,
        },
      }).unwrap();

      setShowAddRole(false);
      onUpdated();
    } catch (err: unknown) {
      setErrorMsg(apiErrorMessage(err, 'Failed to assign role.'));
    }
  };

  /** Step 1: ask for confirmation (ConfirmDialog below). */
  const handleRevokeRole = (assignmentId: string) => setPendingRevokeId(assignmentId);

  /** Step 2: confirmed. */
  const confirmRevokeRole = async () => {
    if (!pendingRevokeId) return;
    try {
      await revokeRole({ userId: user.id, assignmentId: pendingRevokeId }).unwrap();
      onUpdated();
    } catch (err: unknown) {
      setErrorMsg(apiErrorMessage(err, 'Failed to revoke role.'));
    } finally {
      setPendingRevokeId(null);
    }
  };

  const sitesMap = new Map<string, string>();
  sites.forEach((s) => sitesMap.set(s.id, s.name));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Edit2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.users.editUser || 'Edit Administrator'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
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

        {/* Form Body */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="edit-user-status"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.users.status || 'Account Status'}
            </label>
            <NativeSelect
              id="edit-user-status"
              value={status}
              disabled={isDeactivationLocked}
              onValueChange={(value) => {
                const next = toUserStatus(value);
                if (next) setStatus(next);
              }}
              options={STATUS_SELECT_OPTIONS}
              className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {isDeactivationLocked && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                Account status is locked because this is the last active Super Admin.
              </p>
            )}
          </div>

          {/* Password Reset */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Reset Password (leave blank to keep unchanged)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (optional)"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Role Assignments Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Assigned Roles ({user.roles.length})
              </label>
              <button
                type="button"
                onClick={() => setShowAddRole(!showAddRole)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Assign Role</span>
              </button>
            </div>

            {/* List of current roles */}
            <div className="space-y-2 mb-3">
              {user.roles.map((r) => {
                const siteName = r.siteId ? sitesMap.get(r.siteId) || 'Site' : null;
                const isPlatform = r.scopeType === 'platform';
                return (
                  <div
                    key={r.assignmentId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {isPlatform ? (
                        <Shield className="size-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {r.roleName}
                        </span>
                        {siteName && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                            ({siteName})
                          </span>
                        )}
                      </div>
                    </div>
                    {user.roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRevokeRole(r.assignmentId)}
                        disabled={isRevoking}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Revoke Role"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Role Drawer */}
            {showAddRole && (
              <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Assign New Role
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <NativeSelect
                    aria-label="Role to assign"
                    value={roleKey}
                    onValueChange={setRoleKey}
                    options={ADD_ROLE_OPTIONS}
                    className={INLINE_SELECT_CLASS}
                  />

                  {roleKey !== 'super_admin' && (
                    <NativeSelect
                      aria-label="Site for the role"
                      value={selectedSiteId}
                      onValueChange={setSelectedSiteId}
                      options={sites.map((s) => ({ value: s.id, label: s.name }))}
                      className={INLINE_SELECT_CLASS}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRole(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAssignRole}
                    disabled={isAssigning}
                    className="px-3 py-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {isAssigning ? 'Saving...' : 'Add Role'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {t.users.cancel || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
              <span>{t.users.saveChanges || 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={pendingRevokeId !== null}
        title="Revoke this role?"
        description={`${user.displayName} loses the access this role grants as soon as it is revoked.`}
        confirmLabel="Revoke role"
        busyLabel="Revoking…"
        isBusy={isRevoking}
        onConfirm={() => void confirmRevokeRole()}
        onCancel={() => setPendingRevokeId(null)}
      />
    </div>
  );
}
