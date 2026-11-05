'use client';

import { useState, type FormEvent } from 'react';
import { User } from 'lucide-react';
import type { UserItem, UserStatus } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';

import { USER_STATUS_OPTIONS } from '../roles';

const STATUS_BADGE: Record<UserStatus, string> = {
  active: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  invited: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  suspended: 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  disabled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const FIELD =
  'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';

interface UserProfileCardProps {
  readonly user: UserItem;
  readonly canEdit: boolean;
  /** The last active Super Admin cannot change away from "active". */
  readonly statusLocked: boolean;
  readonly isSaving: boolean;
  readonly onSave: (displayName: string, status: UserStatus) => Promise<boolean>;
}

function Row({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt>{label}</dt>
      <dd className="font-semibold text-right">{children}</dd>
    </div>
  );
}

/** Profile facts, with an inline edit form for Super Admins. */
export function UserProfileCard({
  user,
  canEdit,
  statusLocked,
  isSaving,
  onSave,
}: UserProfileCardProps) {
  const { locale } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [status, setStatus] = useState<UserStatus>(user.status);

  const startEditing = () => {
    setDisplayName(user.displayName);
    setStatus(user.status);
    setIsEditing(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave(displayName, status)) setIsEditing(false);
  };

  return (
    <section
      aria-labelledby="user-profile-heading"
      className="md:col-span-1 flex flex-col gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2
          id="user-profile-heading"
          className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"
        >
          <User className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>Account profile</span>
        </h2>
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold hover:underline cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
            >
              Display name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label
              htmlFor="profile-status"
              className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1"
            >
              Status
            </label>
            <select
              id="profile-status"
              value={status}
              disabled={statusLocked}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className={`${FIELD} disabled:opacity-60`}
            >
              {USER_STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {statusLocked && (
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                The last active Super Admin must stay active.
              </p>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3.5 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Display name
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.displayName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Email</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 break-all">
              {user.email}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Status</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 capitalize ${STATUS_BADGE[user.status]}`}
            >
              {user.status}
            </span>
          </div>
          <dl className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <Row label="Last sign-in">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt, locale, 'UTC') : 'Never'}
            </Row>
            <Row label="Created">{formatDateTime(user.createdAt, locale, 'UTC')}</Row>
            <Row label="Failed sign-ins">
              <span
                className={user.failedLoginCount > 0 ? 'text-amber-800 dark:text-amber-300' : ''}
              >
                {user.failedLoginCount}
              </span>
            </Row>
            {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
              <Row label="Locked until">{formatDateTime(user.lockedUntil, locale, 'UTC')}</Row>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}
