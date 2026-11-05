'use client';

import { useMemo, useState } from 'react';
import type { UserRoleSummary, UserStatus } from '@multi-site-cms/types';

import { useActionNotice } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useAssignRoleMutation,
  useGetUserQuery,
  useGetUserStatsQuery,
  useListSitesQuery,
  useRevokeRoleMutation,
  useUpdateUserMutation,
} from '@/lib/cms-api';

import {
  isLastActiveSuperAdmin,
  isSuperAdminUser,
  roleScope,
  type AssignableRoleKey,
} from '../roles';

/**
 * State and actions of the user detail screen. The page only composes
 * presentation components around this hook.
 */
export function useUserDetail(userId: string) {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<UserRoleSummary | null>(null);
  const [pendingStatus, setPendingStatus] = useState<UserStatus | null>(null);
  const notices = useActionNotice();

  const { data: user, isLoading, error } = useGetUserQuery(userId, { skip: !userId });
  const { data: stats } = useGetUserStatsQuery();
  const { data: sites = [] } = useListSitesQuery();

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [assignRole, { isLoading: isAssigning }] = useAssignRoleMutation();
  const [revokeRole, { isLoading: isRevoking }] = useRevokeRoleMutation();

  const sitesById = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const isLastSuperAdmin = user
    ? isLastActiveSuperAdmin(user, stats?.activeSuperAdmins ?? 0)
    : false;

  /** Resolves true when saved (so the form can leave edit mode). */
  const saveProfile = async (displayName: string, status: UserStatus): Promise<boolean> => {
    try {
      await updateUser({ userId, data: { displayName: displayName.trim(), status } }).unwrap();
      notices.success('Profile updated.');
      return true;
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to update the profile.'));
      return false;
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    try {
      await updateUser({ userId, data: { status: pendingStatus } }).unwrap();
      notices.success(`Account is now ${pendingStatus}.`);
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to change the account status.'));
    } finally {
      setPendingStatus(null);
    }
  };

  /** Resolves true when the role was assigned (so the dialog can close). */
  const assign = async (roleKey: AssignableRoleKey, siteId: string): Promise<boolean> => {
    const scope = roleScope(roleKey);
    if (scope === 'site' && !siteId) {
      notices.error('Choose a site for a site role.');
      return false;
    }
    try {
      await assignRole({
        userId,
        data: { roleKey, scopeType: scope, siteId: scope === 'site' ? siteId : undefined },
      }).unwrap();
      notices.success('Role assigned.');
      return true;
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to assign the role.'));
      return false;
    }
  };

  const confirmRevoke = async () => {
    if (!pendingRevoke) return;
    try {
      await revokeRole({ userId, assignmentId: pendingRevoke.assignmentId }).unwrap();
      notices.success(`Revoked ${pendingRevoke.roleName}.`);
    } catch (err: unknown) {
      notices.error(apiErrorMessage(err, 'Failed to revoke the role.'));
    } finally {
      setPendingRevoke(null);
    }
  };

  return {
    user,
    isLoading,
    error,
    sites,
    sitesById,
    isUserSuperAdmin: user ? isSuperAdminUser(user) : false,
    isLastSuperAdmin,
    notice: notices.notice,
    dismissNotice: notices.dismiss,
    saveProfile,
    isUpdating,
    pendingStatus,
    requestStatus: setPendingStatus,
    cancelStatus: () => setPendingStatus(null),
    confirmStatusChange,
    isRoleDialogOpen,
    openRoleDialog: () => setIsRoleDialogOpen(true),
    closeRoleDialog: () => setIsRoleDialogOpen(false),
    assign,
    isAssigning,
    pendingRevoke,
    requestRevoke: setPendingRevoke,
    cancelRevoke: () => setPendingRevoke(null),
    confirmRevoke,
    isRevoking,
  };
}

export type UserDetail = ReturnType<typeof useUserDetail>;
