'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2, Lock, Unlock } from 'lucide-react';

import { ActionNotice, ConfirmDialog } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { AssignRoleDialog } from '@/features/users/components/AssignRoleDialog';
import { UserProfileCard } from '@/features/users/components/UserProfileCard';
import { UserRolesCard } from '@/features/users/components/UserRolesCard';
import { useUserDetail } from '@/features/users/hooks/useUserDetail';
import { useAdmin } from '@/lib/admin-context';

/**
 * User detail: orchestration only. State and actions live in useUserDetail;
 * each section is a component in features/users.
 */
export default function UserDetailPage() {
  const params = useParams();
  const raw = params?.userId;
  const userId = typeof raw === 'string' ? raw : Array.isArray(raw) ? (raw[0] ?? '') : '';
  const { isSuperAdmin } = useAdmin();
  const detail = useUserDetail(userId);
  const { user } = detail;

  if (detail.isLoading) {
    return (
      <ShellLayout requiredPermission="user:read">
        <div className="flex flex-col items-center justify-center py-20 gap-3" role="status">
          <Loader2 className="size-8 animate-spin text-emerald-600" aria-hidden="true" />
          <span className="text-xs text-slate-600 dark:text-slate-400">Loading user…</span>
        </div>
      </ShellLayout>
    );
  }

  if (detail.error || !user) {
    return (
      <ShellLayout requiredPermission="user:read">
        <div
          className="p-8 text-center flex flex-col items-center gap-3 max-w-md mx-auto"
          role="alert"
        >
          <AlertCircle className="size-10 text-rose-600" aria-hidden="true" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">User not found</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The account does not exist or you do not have access to it.
          </p>
          <Link
            href="/users"
            className="mt-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100"
          >
            Back to users
          </Link>
        </div>
      </ShellLayout>
    );
  }

  const isActive = user.status === 'active';
  const nextStatus = isActive ? 'suspended' : 'active';

  return (
    <ShellLayout requiredPermission="user:read">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/users"
              aria-label="Back to users"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {user.displayName}
                </h1>
                {detail.isUserSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    Super Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
                {user.email}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => detail.requestStatus(nextStatus)}
              disabled={detail.isUpdating || (isActive && detail.isLastSuperAdmin)}
              title={
                isActive && detail.isLastSuperAdmin
                  ? 'The last active Super Admin cannot be suspended.'
                  : undefined
              }
              className={`inline-flex items-center gap-1.5 self-start px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/20'
                  : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/20'
              }`}
            >
              {isActive ? (
                <Lock className="size-3.5" aria-hidden="true" />
              ) : (
                <Unlock className="size-3.5" aria-hidden="true" />
              )}
              <span>{isActive ? 'Suspend account' : 'Reactivate account'}</span>
            </button>
          )}
        </div>

        <ActionNotice notice={detail.notice} onDismiss={detail.dismissNotice} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UserProfileCard
            key={user.updatedAt}
            user={user}
            canEdit={isSuperAdmin}
            statusLocked={detail.isLastSuperAdmin}
            isSaving={detail.isUpdating}
            onSave={detail.saveProfile}
          />
          <UserRolesCard
            roles={user.roles}
            sitesById={detail.sitesById}
            canManage={isSuperAdmin}
            onAssign={detail.openRoleDialog}
            onRevoke={detail.requestRevoke}
          />
        </div>
      </div>

      <AssignRoleDialog
        open={detail.isRoleDialogOpen}
        userName={user.displayName}
        sites={detail.sites}
        isAssigning={detail.isAssigning}
        onAssign={detail.assign}
        onClose={detail.closeRoleDialog}
      />

      <ConfirmDialog
        open={detail.pendingRevoke !== null}
        title="Revoke this role?"
        description={`${user.displayName} loses the access granted by ${detail.pendingRevoke?.roleName ?? 'this role'} immediately.`}
        confirmLabel="Revoke role"
        busyLabel="Revoking…"
        isBusy={detail.isRevoking}
        onConfirm={() => void detail.confirmRevoke()}
        onCancel={detail.cancelRevoke}
      />

      <ConfirmDialog
        open={detail.pendingStatus !== null}
        title={
          detail.pendingStatus === 'suspended'
            ? 'Suspend this account?'
            : 'Reactivate this account?'
        }
        description={
          detail.pendingStatus === 'suspended'
            ? `${user.displayName} is signed out everywhere and cannot sign in until reactivated.`
            : `${user.displayName} can sign in again with their existing roles.`
        }
        confirmLabel={detail.pendingStatus === 'suspended' ? 'Suspend' : 'Reactivate'}
        tone={detail.pendingStatus === 'suspended' ? 'danger' : 'default'}
        isBusy={detail.isUpdating}
        onConfirm={() => void detail.confirmStatusChange()}
        onCancel={detail.cancelStatus}
      />
    </ShellLayout>
  );
}
