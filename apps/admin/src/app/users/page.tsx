'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { useListUsersQuery, useListSitesQuery } from '@/lib/cms-api';
import type { UserItem } from '@multi-site-cms/types';

export default function UsersPage() {
  const { t, isSuperAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useListUsersQuery({
    search: searchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: sitesData } = useListSitesQuery();
  const sitesMap = React.useMemo(() => {
    const map = new Map<string, string>();
    sitesData?.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sitesData]);

  const filteredUsers = React.useMemo(() => {
    if (!usersData?.items) return [];
    return usersData.items.filter((user) => {
      if (roleFilter === 'all') return true;
      if (roleFilter === 'super_admin') {
        return user.roles.some((r) => r.roleKey === 'super_admin' || r.scopeType === 'platform');
      }
      if (roleFilter === 'site_admin') {
        return user.roles.some((r) => r.roleKey === 'site_admin');
      }
      if (roleFilter === 'site_editor') {
        return user.roles.some((r) => r.roleKey === 'site_editor');
      }
      return true;
    });
  }, [usersData, roleFilter]);

  // Count active super admins to surface warning if <= 1
  const superAdminCount = React.useMemo(() => {
    if (!usersData?.items) return 0;
    return usersData.items.filter(
      (u) =>
        u.status === 'active' &&
        u.roles.some((r) => r.roleKey === 'super_admin' || r.scopeType === 'platform'),
    ).length;
  }, [usersData]);

  return (
    <ShellLayout requiredPermission="user:read">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t('users.title')}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('users.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <Link
                href="/users/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('users.createUser')}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Protection Note */}
        {superAdminCount <= 1 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">{t('users.protectSuperAdmin')}</p>
              <p className="text-amber-700 dark:text-amber-300">
                Only {superAdminCount} active Platform Super Admin currently exists. Account
                deactivation is locked.
              </p>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="site_admin">Site Admins</option>
              <option value="site_editor">Site Editors</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="locked">Locked</option>
            </select>

            <button
              onClick={() => refetch()}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {t('actions.refresh')}
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-xs">Loading administrators...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                Failed to load user list. Please check your permissions.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No users found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">{t('users.roles')}</th>
                    <th className="py-3.5 px-4">{t('users.status')}</th>
                    <th className="py-3.5 px-4">{t('users.lastLogin')}</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredUsers.map((user: UserItem) => {
                    const isUserSuperAdmin = user.roles.some(
                      (r) => r.roleKey === 'super_admin' || r.scopeType === 'platform',
                    );

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Name and Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                              {user.displayName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span className="truncate">{user.displayName}</span>
                                {isUserSuperAdmin && (
                                  <span title="Super Admin" className="inline-flex">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Roles & Scopes */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                            {user.roles.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">
                                No roles assigned
                              </span>
                            ) : (
                              user.roles.map((r) => {
                                const siteName = r.siteId ? sitesMap.get(r.siteId) || 'Site' : null;
                                return (
                                  <span
                                    key={r.assignmentId}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                                      r.scopeType === 'platform'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                    }`}
                                  >
                                    {r.scopeType === 'platform' ? (
                                      <Shield className="w-3 h-3 text-purple-500" />
                                    ) : (
                                      <Globe className="w-3 h-3 text-blue-500" />
                                    )}
                                    <span>{r.roleName}</span>
                                    {siteName && (
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        ({siteName})
                                      </span>
                                    )}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                        </td>

                        {/* Last Login */}
                        <td className="py-4 px-4 text-slate-500">
                          {user.lastLoginAt ? (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Never</span>
                          )}
                        </td>

                        {/* Action Link */}
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/users/${user.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          >
                            <span>Manage</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
