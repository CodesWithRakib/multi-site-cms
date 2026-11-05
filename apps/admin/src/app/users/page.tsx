'use client';

import React, { useState, useMemo } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldAlert,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useListUsersQuery,
  useListSitesQuery,
  useUpdateUserMutation,
} from '@/lib/cms-api';
import type { UserItem } from '@multi-site-cms/types';
import {
  UserStatsCards,
  UserFilterBar,
  UserTable,
  CreateUserModal,
  EditUserModal,
} from '@/features/users';

export default function UsersPage() {
  const { t, isSuperAdmin } = useAdmin();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Queries
  const {
    data: usersData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useListUsersQuery({
    search: searchTerm.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: sitesData } = useListSitesQuery();
  const [updateUser] = useUpdateUserMutation();

  const sites = useMemo(() => sitesData ?? [], [sitesData]);

  const sitesMap = useMemo(() => {
    const map = new Map<string, string>();
    sites.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sites]);

  const allUsers = useMemo(() => usersData?.items ?? [], [usersData]);

  // Client-side filtering for role and site
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      // 1. Role Filter
      if (roleFilter !== 'all') {
        const matchesRole = user.roles.some((r) => {
          if (roleFilter === 'super_admin') {
            return r.roleKey === 'super_admin' || r.scopeType === 'platform';
          }
          if (roleFilter === 'admin' || roleFilter === 'site_admin') {
            return r.roleKey === 'admin' || r.roleKey === 'site_admin';
          }
          return r.roleKey === roleFilter;
        });
        if (!matchesRole) return false;
      }

      // 2. Site Filter
      if (siteFilter !== 'all') {
        const matchesSite = user.roles.some((r) => r.siteId === siteFilter);
        if (!matchesSite) return false;
      }

      return true;
    });
  }, [allUsers, roleFilter, siteFilter]);

  // Count active super admins to protect against lockout
  const superAdminCount = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.status === 'active' &&
        u.roles.some((r) => r.roleKey === 'super_admin' || r.scopeType === 'platform'),
    ).length;
  }, [allUsers]);

  // Quick Status Toggle (Suspend / Activate)
  const handleToggleStatus = async (user: UserItem) => {
    const isSuper = user.roles.some(
      (r) => r.roleKey === 'super_admin' || r.scopeType === 'platform',
    );
    if (isSuper && user.status === 'active' && superAdminCount <= 1) {
      alert(t.users.protectSuperAdmin || 'The last active Super Admin account cannot be deactivated.');
      return;
    }

    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'active' ? 'activate' : 'suspend';

    if (confirm(`Are you sure you want to ${actionLabel} ${user.displayName}?`)) {
      try {
        await updateUser({
          userId: user.id,
          data: { status: nextStatus },
        }).unwrap();
        refetch();
      } catch (err: unknown) {
        const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
        alert(apiErr?.data?.error?.message || apiErr?.message || 'Failed to update user status.');
      }
    }
  };

  return (
    <ShellLayout requiredPermission="user:read">
      <div className="w-full space-y-6 pb-16">
        {/* ========================================================= */}
        {/* TOP HEADER: Title, Badge, Refresh & Create User */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-xs">
                <UsersIcon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {t.users.title}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    RBAC Protected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.users.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="size-4" />
                <span>{t.users.createUser}</span>
              </button>
            )}
          </div>
        </div>

        {/* Protection Note */}
        {superAdminCount <= 1 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="size-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">{t.users.protectSuperAdmin}</p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                Only {superAdminCount} active Platform Super Admin currently exists. Account deactivation is locked.
              </p>
            </div>
          </div>
        )}

        {/* Top 4 Metrics Cards */}
        <UserStatsCards users={allUsers} />

        {/* Filter Toolbar */}
        <UserFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          siteFilter={siteFilter}
          onSiteFilterChange={setSiteFilter}
          sites={sites}
          onRefresh={() => refetch()}
          isFetching={isFetching}
        />

        {/* Main Users Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
            <Loader2 className="size-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Loading administrators...
            </span>
          </div>
        ) : error ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900">
            <AlertCircle className="size-8 text-rose-500" />
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Failed to load administrators. Please check your permissions.
            </p>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            sitesMap={sitesMap}
            onEditUser={(u) => setEditingUser(u)}
            onToggleStatus={handleToggleStatus}
            superAdminCount={superAdminCount}
          />
        )}

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => refetch()}
          sites={sites}
        />

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            key={editingUser.id}
            user={editingUser}
            isOpen={true}
            onClose={() => setEditingUser(null)}
            onUpdated={() => refetch()}
            sites={sites}
            superAdminCount={superAdminCount}
          />
        )}
      </div>
    </ShellLayout>
  );
}
