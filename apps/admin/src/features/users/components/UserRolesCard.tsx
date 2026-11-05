'use client';

import { Globe, Key, Plus, Shield, Trash2 } from 'lucide-react';
import type { UserRoleSummary } from '@multi-site-cms/types';

interface UserRolesCardProps {
  readonly roles: readonly UserRoleSummary[];
  readonly sitesById: ReadonlyMap<string, string>;
  readonly canManage: boolean;
  readonly onAssign: () => void;
  readonly onRevoke: (role: UserRoleSummary) => void;
}

/** Roles granted to the user, platform-wide or per site. */
export function UserRolesCard({
  roles,
  sitesById,
  canManage,
  onAssign,
  onRevoke,
}: UserRolesCardProps) {
  return (
    <section
      aria-labelledby="user-roles-heading"
      className="md:col-span-2 flex flex-col gap-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2
            id="user-roles-heading"
            className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2"
          >
            <Key className="size-4 text-purple-700 dark:text-purple-300" aria-hidden="true" />
            <span>Roles</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Platform roles apply everywhere; site roles apply to one site.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            <span>Assign role</span>
          </button>
        )}
      </div>

      {roles.length === 0 ? (
        <p className="p-8 text-center text-slate-600 dark:text-slate-400 text-xs border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
          No roles assigned. This user cannot perform any administrative action.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {roles.map((role) => {
            const isPlatform = role.scopeType === 'platform';
            const siteName = role.siteId ? (sitesById.get(role.siteId) ?? 'Unknown site') : null;
            return (
              <li
                key={role.assignmentId}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isPlatform
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}
                    aria-hidden="true"
                  >
                    {isPlatform ? <Shield className="size-4" /> : <Globe className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {role.roleName}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {isPlatform ? 'Platform-wide' : siteName}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => onRevoke(role)}
                    aria-label={`Revoke ${role.roleName}${siteName ? ` on ${siteName}` : ''}`}
                    className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
