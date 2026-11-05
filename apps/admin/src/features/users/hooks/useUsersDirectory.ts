'use client';

import { useMemo, useState } from 'react';
import type { UserItem, UserStatus } from '@multi-site-cms/types';

import { useActionNotice } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetUserStatsQuery,
  useListSitesQuery,
  useListUsersQuery,
  useUpdateUserMutation,
} from '@/lib/cms-api';

import { isLastActiveSuperAdmin } from '../roles';

export const USERS_PAGE_SIZE = 20;

/**
 * State and actions of the users directory. Search, role, status, and site
 * filters run in the API (they used to filter one page client-side, and the
 * search answered 400); counts come from `GET /users/stats`.
 */
export function useUsersDirectory() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [pendingToggle, setPendingToggle] = useState<UserItem | null>(null);
  const notices = useActionNotice();

  const usersQuery = useListUsersQuery({
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    roleKey: roleFilter !== 'all' ? roleFilter : undefined,
    siteId: siteFilter !== 'all' ? siteFilter : undefined,
    page,
    limit: USERS_PAGE_SIZE,
  });
  const { data: stats, isLoading: isStatsLoading } = useGetUserStatsQuery();
  const { data: sitesData } = useListSitesQuery();
  const [updateUser, { isLoading: isTogglingStatus }] = useUpdateUserMutation();

  const sites = useMemo(() => sitesData ?? [], [sitesData]);
  const sitesMap = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const activeSuperAdmins = stats?.activeSuperAdmins ?? 0;

  /** Any filter change returns to the first page. */
  const resetting =
    <T>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const requestToggle = (user: UserItem) => {
    if (isLastActiveSuperAdmin(user, activeSuperAdmins)) {
      notices.error('The last active Super Admin cannot be deactivated.');
      return;
    }
    setPendingToggle(user);
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    const next: UserStatus = pendingToggle.status === 'active' ? 'suspended' : 'active';
    try {
      await updateUser({ userId: pendingToggle.id, data: { status: next } }).unwrap();
      notices.success(
        `${pendingToggle.displayName} is now ${next === 'active' ? 'active' : 'suspended'}.`,
      );
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to update the account status.'));
    } finally {
      setPendingToggle(null);
    }
  };

  return {
    users: usersQuery.data?.items ?? [],
    total: usersQuery.data?.total ?? 0,
    totalPages: usersQuery.data?.totalPages ?? 1,
    page,
    setPage,
    isLoading: usersQuery.isLoading,
    isFetching: usersQuery.isFetching,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    stats,
    isStatsLoading,
    activeSuperAdmins,
    sites,
    sitesMap,
    filters: { search, roleFilter, statusFilter, siteFilter },
    setSearch: resetting(setSearch),
    setRoleFilter: resetting(setRoleFilter),
    setStatusFilter: resetting(setStatusFilter),
    setSiteFilter: resetting(setSiteFilter),
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    editingUser,
    setEditingUser,
    pendingToggle,
    requestToggle,
    cancelToggle: () => setPendingToggle(null),
    confirmToggle,
    isTogglingStatus,
    notice: notices.notice,
    dismissNotice: notices.dismiss,
  };
}

export type UsersDirectory = ReturnType<typeof useUsersDirectory>;
