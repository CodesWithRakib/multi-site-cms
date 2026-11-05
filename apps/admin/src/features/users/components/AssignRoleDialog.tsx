'use client';

import { useState, type FormEvent } from 'react';
import type { SiteItem } from '@multi-site-cms/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@multi-site-cms/ui';

import { ASSIGNABLE_ROLES, roleScope, type AssignableRoleKey } from '../roles';

const FIELD =
  'w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';

interface AssignRoleDialogProps {
  readonly open: boolean;
  readonly userName: string;
  readonly sites: readonly SiteItem[];
  readonly isAssigning: boolean;
  /** Resolves true when assigned (the dialog then closes). */
  readonly onAssign: (roleKey: AssignableRoleKey, siteId: string) => Promise<boolean>;
  readonly onClose: () => void;
}

/** Grants a platform or site role. Accessible Radix dialog. */
export function AssignRoleDialog({
  open,
  userName,
  sites,
  isAssigning,
  onAssign,
  onClose,
}: AssignRoleDialogProps) {
  const [roleKey, setRoleKey] = useState<AssignableRoleKey>('admin');
  const [siteId, setSiteId] = useState('');
  const needsSite = roleScope(roleKey) === 'site';
  const selected = ASSIGNABLE_ROLES.find((role) => role.key === roleKey);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onAssign(roleKey, siteId)) {
      setSiteId('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="text-base text-slate-900 dark:text-slate-100">
              Assign role
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
              Grant administrative access to {userName}.
            </DialogDescription>
          </DialogHeader>

          <div>
            <label
              htmlFor="assign-role"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Role
            </label>
            <select
              id="assign-role"
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value as AssignableRoleKey)}
              aria-describedby="assign-role-help"
              className={FIELD}
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.label}
                </option>
              ))}
            </select>
            <p
              id="assign-role-help"
              className="text-[11px] text-slate-600 dark:text-slate-400 mt-1"
            >
              {selected?.description}
            </p>
          </div>

          {needsSite && (
            <div>
              <label
                htmlFor="assign-site"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Site
              </label>
              <select
                id="assign-site"
                required
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className={FIELD}
              >
                <option value="">Choose a site…</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({site.key})
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {isAssigning ? 'Assigning…' : 'Assign role'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
