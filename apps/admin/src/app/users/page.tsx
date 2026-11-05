'use client';

import { AlertCircle, Loader2, ShieldAlert, UserPlus, Users as UsersIcon } from 'lucide-react';

import { ActionNotice, ConfirmDialog } from '@/components/feedback';
import { Pagination } from '@/components/navigation/Pagination';
import { ShellLayout } from '@/components/shell';
import {
  CreateUserModal,
  EditUserModal,
  UserFilterBar,
  UserStatsCards,
  UserTable,
} from '@/features/users';
import { USERS_PAGE_SIZE, useUsersDirectory } from '@/features/users/hooks/useUsersDirectory';
import { useAdmin } from '@/lib/admin-context';

/**
 * Users directory: orchestration only. Filtering and counts run in the API
 * (useUsersDirectory); each section is a component in features/users.
 */
export default function UsersPage() {
  const { t, isSuperAdmin } = useAdmin();
  const directory = useUsersDirectory();
  const { filters, pendingToggle } = directory;

  return (
    <ShellLayout requiredPermission="user:read">
      <div className="w-full space-y-6 pb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs">
              <UsersIcon className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t.users.title}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t.users.subtitle}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={directory.openCreate}
              className="flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              <span>{t.users.createUser}</span>
            </button>
          )}
        </div>

        <ActionNotice notice={directory.notice} onDismiss={directory.dismissNotice} />

        {directory.stats && directory.activeSuperAdmins <= 1 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
            <ShieldAlert className="size-5 text-amber-700 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">{t.users.protectSuperAdmin}</p>
              <p className="mt-0.5">
                Only {directory.activeSuperAdmins} active Super Admin exists, so that account cannot
                be deactivated. Add a second Super Admin first.
              </p>
            </div>
          </div>
        )}

        <UserStatsCards stats={directory.stats} isLoading={directory.isStatsLoading} />

        <UserFilterBar
          searchTerm={filters.search}
          onSearchChange={directory.setSearch}
          roleFilter={filters.roleFilter}
          onRoleFilterChange={directory.setRoleFilter}
          statusFilter={filters.statusFilter}
          onStatusFilterChange={directory.setStatusFilter}
          siteFilter={filters.siteFilter}
          onSiteFilterChange={directory.setSiteFilter}
          sites={directory.sites}
          onRefresh={() => void directory.refetch()}
          isFetching={directory.isFetching}
        />

        {directory.isLoading ? (
          <div
            className="flex flex-col items-center justify-center p-24 gap-3 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80"
            role="status"
          >
            <Loader2 className="size-8 animate-spin text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Loading users…
            </span>
          </div>
        ) : directory.error ? (
          <div
            role="alert"
            className="p-12 text-center flex flex-col items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900"
          >
            <AlertCircle className="size-8 text-rose-600" aria-hidden="true" />
            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
              The users could not be loaded. Check your permissions and try again.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden">
            <UserTable
              users={directory.users}
              sitesMap={directory.sitesMap}
              onEditUser={directory.setEditingUser}
              onToggleStatus={directory.requestToggle}
              superAdminCount={directory.activeSuperAdmins}
            />
            <Pagination
              page={directory.page}
              totalPages={directory.totalPages}
              total={directory.total}
              pageSize={USERS_PAGE_SIZE}
              itemLabel="users"
              onPageChange={directory.setPage}
            />
          </div>
        )}

        <CreateUserModal
          isOpen={directory.isCreateOpen}
          onClose={directory.closeCreate}
          onCreated={() => void directory.refetch()}
          sites={directory.sites}
        />

        {directory.editingUser && (
          <EditUserModal
            key={directory.editingUser.id}
            user={directory.editingUser}
            isOpen
            onClose={() => directory.setEditingUser(null)}
            onUpdated={() => void directory.refetch()}
            sites={directory.sites}
            superAdminCount={directory.activeSuperAdmins}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingToggle !== null}
        title={
          pendingToggle?.status === 'active' ? 'Suspend this account?' : 'Reactivate this account?'
        }
        description={
          pendingToggle?.status === 'active'
            ? `${pendingToggle.displayName} is signed out everywhere and cannot sign in until reactivated.`
            : `${pendingToggle?.displayName ?? ''} can sign in again with their existing roles.`
        }
        confirmLabel={pendingToggle?.status === 'active' ? 'Suspend' : 'Reactivate'}
        tone={pendingToggle?.status === 'active' ? 'danger' : 'default'}
        isBusy={directory.isTogglingStatus}
        onConfirm={() => void directory.confirmToggle()}
        onCancel={directory.cancelToggle}
      />
    </ShellLayout>
  );
}
