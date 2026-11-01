'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Globe,
  User,
  Key,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useGetUserQuery,
  useUpdateUserMutation,
  useAssignRoleMutation,
  useRevokeRoleMutation,
  useListSitesQuery,
} from '@/lib/cms-api';
import type { UserRoleSummary, UserStatus } from '@multi-site-cms/types';

export default function UserDetailPage() {
  const params = useParams();
  const rawUserId = params?.userId;
  const userId =
    typeof rawUserId === 'string' ? rawUserId : Array.isArray(rawUserId) ? rawUserId[0] || '' : '';

  const { t, isSuperAdmin } = useAdmin();

  // Queries
  const { data: user, isLoading, error, refetch } = useGetUserQuery(userId, { skip: !userId });
  const { data: sitesData } = useListSitesQuery();

  // Mutations
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();
  const [revokeRole, { isLoading: isRevoking }] = useRevokeRoleMutation();

  // Edit State
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Role Assignment Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('site_admin');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const startEditing = () => {
    if (user) {
      setDisplayName(user.displayName);
      setStatus(user.status);
      setIsEditingProfile(true);
    }
  };

  const sitesMap = React.useMemo(() => {
    const map = new Map<string, string>();
    sitesData?.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sitesData]);

  const isUserSuperAdmin = user?.roles.some(
    (r) => r.roleKey === 'super_admin' || r.scopeType === 'platform',
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    try {
      await updateUser({
        userId,
        data: {
          displayName: displayName.trim(),
          status,
        },
      }).unwrap();
      setIsEditingProfile(false);
      setActionMessage({ type: 'success', text: 'User profile updated successfully.' });
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to update profile.',
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmText =
      nextStatus === 'suspended'
        ? `Are you sure you want to suspend ${user.displayName}? They will lose immediate access.`
        : `Reactivate ${user.displayName}?`;

    if (!window.confirm(confirmText)) return;

    setActionMessage(null);
    try {
      await updateUser({
        userId,
        data: { status: nextStatus },
      }).unwrap();
      setActionMessage({ type: 'success', text: `User account set to ${nextStatus}.` });
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to change status.',
      });
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const isPlatform = selectedRoleKey === 'super_admin';
    if (!isPlatform && !selectedSiteId) {
      setActionMessage({ type: 'error', text: 'Please select a site for site-scoped roles.' });
      return;
    }

    try {
      await assignRole({
        userId,
        data: {
          roleKey: selectedRoleKey,
          scopeType: isPlatform ? 'platform' : 'site',
          siteId: isPlatform ? undefined : selectedSiteId || undefined,
        },
      }).unwrap();
      setIsRoleModalOpen(false);
      setSelectedSiteId('');
      setActionMessage({ type: 'success', text: 'Role successfully assigned to user.' });
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to assign role.',
      });
    }
  };

  const handleRevokeRole = async (role: UserRoleSummary) => {
    if (!window.confirm(`Revoke role "${role.roleName}" from this user?`)) return;

    setActionMessage(null);
    try {
      await revokeRole({
        userId,
        assignmentId: role.assignmentId,
      }).unwrap();
      setActionMessage({ type: 'success', text: `Revoked ${role.roleName}.` });
      refetch();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to revoke role.',
      });
    }
  };

  if (isLoading) {
    return (
      <ShellLayout requiredPermission="user:read">
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-xs">Loading user details...</span>
        </div>
      </ShellLayout>
    );
  }

  if (error || !user) {
    return (
      <ShellLayout requiredPermission="user:read">
        <div className="p-8 text-center flex flex-col items-center gap-3 max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Not Found</h2>
          <p className="text-xs text-slate-500">
            The requested administrator account could not be found or you lack permission.
          </p>
          <Link
            href="/users"
            className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold"
          >
            Back to Users
          </Link>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout requiredPermission="user:read">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/users"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {user.displayName}
                </h1>
                {isUserSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  user.status === 'active'
                    ? 'border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/20'
                    : 'border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/20'
                }`}
              >
                {user.status === 'active' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Suspend Account</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reactivate Account</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Profile Card */}
          <div className="md:col-span-1 flex flex-col gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <span>Account Profile</span>
              </h2>
              {isSuperAdmin && !isEditingProfile && (
                <button
                  onClick={startEditing}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Display Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {user.displayName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{user.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Account Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                      user.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : user.status === 'suspended'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        user.status === 'active'
                          ? 'bg-emerald-500'
                          : user.status === 'suspended'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                      }`}
                    />
                    <span className="capitalize">{user.status}</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Last Login:</span>
                    <span className="font-semibold">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Account Created:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failed Attempts:</span>
                    <span className={user.failedLoginCount > 0 ? 'text-amber-600 font-bold' : ''}>
                      {user.failedLoginCount}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roles & Scopes Card */}
          <div className="md:col-span-2 flex flex-col gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-500" />
                  <span>Granted Roles & Permissions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  RBAC roles determine platform-wide or site-scoped administrative authority.
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('actions.assignRole')}</span>
                </button>
              )}
            </div>

            {/* Roles List */}
            {user.roles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                No roles currently assigned. This user cannot perform administrative actions.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {user.roles.map((r) => {
                  const siteName = r.siteId ? sitesMap.get(r.siteId) || 'Site' : null;
                  return (
                    <div
                      key={r.assignmentId}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            r.scopeType === 'platform'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {r.scopeType === 'platform' ? (
                            <Shield className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {r.roleName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              ({r.roleKey})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span className="capitalize">{r.scopeType} Scope</span>
                            {siteName && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {siteName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleRevokeRole(r)}
                          disabled={isRevoking}
                          title="Revoke Role"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Role Assignment Modal */}
        {isRoleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t('users.assignRole')}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Grant new administrative authority to {user.displayName}.
              </p>

              <form onSubmit={handleAssignRole} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    Select Role
                  </label>
                  <select
                    value={selectedRoleKey}
                    onChange={(e) => setSelectedRoleKey(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 font-medium"
                  >
                    <option value="super_admin">Platform Super Admin (Unrestricted)</option>
                    <option value="site_admin">Site Admin (Full site administration)</option>
                    <option value="site_editor">Site Editor (Content editing & publishing)</option>
                    <option value="site_viewer">Site Viewer (Read-only)</option>
                  </select>
                </div>

                {selectedRoleKey !== 'super_admin' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Target Website *
                    </label>
                    <select
                      required
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="">Select a site...</option>
                      {sitesData?.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name} ({site.key})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRoleModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
