'use client';

import { useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@multi-site-cms/ui';

import { apiErrorMessage } from '@/lib/api-error';
import { useChangeOwnPasswordMutation, useGetEffectivePolicyQuery } from '@/lib/cms-api';

const FIELD =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';
const LABEL = 'block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300';

interface ChangePasswordDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

/**
 * Lets any signed-in user change their own password. The API checks the
 * current password and the platform policy and signs out other sessions.
 */
export function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [changePassword, { isLoading }] = useChangeOwnPasswordMutation();
  const { data: policy } = useGetEffectivePolicyQuery(undefined, { skip: !open });

  const minLength = policy?.passwordMinLength ?? 8;
  const rules = policy?.requireStrongPasswords
    ? `At least ${minLength} characters, with an uppercase letter, a lowercase letter, and a number.`
    : `At least ${minLength} characters.`;

  const close = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setDone(false);
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setDone(true);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'The password could not be changed.'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-base text-slate-900 dark:text-slate-100">
            Change password
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
            You stay signed in here; every other device is signed out.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col gap-4">
            <p
              role="status"
              className="text-sm font-semibold text-emerald-800 dark:text-emerald-300"
            >
              Your password was changed.
            </p>
            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="current-password" className={LABEL}>
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="new-password" className={LABEL}>
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={minLength}
                maxLength={128}
                aria-describedby="new-password-rules"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={FIELD}
              />
              <p
                id="new-password-rules"
                className="text-[11px] text-slate-600 dark:text-slate-400 mt-1"
              >
                {rules}
              </p>
            </div>
            <div>
              <label htmlFor="confirm-password" className={LABEL}>
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={FIELD}
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}

            <DialogFooter>
              <button
                type="button"
                onClick={close}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isLoading ? 'Changing…' : 'Change password'}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
