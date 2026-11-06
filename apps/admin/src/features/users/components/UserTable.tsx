'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Shield,
  Globe,
  Calendar,
  ChevronRight,
  AlertCircle,
  Edit2,
  Lock,
  Unlock,
} from 'lucide-react';
import type { UserItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';

export interface UserTableProps {
  users: UserItem[];
  sitesMap: Map<string, string>;
  onEditUser: (user: UserItem) => void;
  onToggleStatus: (user: UserItem) => void;
  superAdminCount: number;
}

export function UserTable({
  users,
  sitesMap,
  onEditUser,
  onToggleStatus,
  superAdminCount,
}: UserTableProps) {
  const { t, isSuperAdmin } = useAdmin();

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        <AlertCircle className="size-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
          {t.users.noUsersFound || 'No administrators found'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Try adjusting your search keywords or filter selections.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
              <th className="py-3.5 px-4">Administrator</th>
              <th className="py-3.5 px-4">{t.users.roles}</th>
              <th className="py-3.5 px-4">{t.users.status}</th>
              <th className="py-3.5 px-4">{t.users.lastLogin}</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {users.map((user) => {
              const isSuper = user.roles.some(
                (r) => r.roleKey === 'super_admin' || r.scopeType === 'platform',
              );
              const isDeactivationLocked =
                isSuper && user.status === 'active' && superAdminCount <= 1;

              // Compute avatar color gradient based on email string
              const initials =
                user.displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'AD';

              return (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Administrator: Avatar, Name & Email */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-linear-to-tr from-emerald-700 via-teal-700 to-cyan-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span className="truncate">{user.displayName}</span>
                          {isSuper && (
                            <span
                              title="Platform Super Admin"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            >
                              <ShieldCheck className="size-3 text-purple-600 dark:text-purple-400" />
                              Super Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Roles & Scopes */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                      {user.roles.length === 0 ? (
                        <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                          No assigned roles
                        </span>
                      ) : (
                        user.roles.map((r) => {
                          const siteName = r.siteId ? sitesMap.get(r.siteId) || 'Site' : null;
                          const isPlatform = r.scopeType === 'platform';

                          return (
                            <span
                              key={r.assignmentId}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                isPlatform
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80'
                              }`}
                            >
                              {isPlatform ? (
                                <Shield className="size-3 text-purple-600 dark:text-purple-400 shrink-0" />
                              ) : (
                                <Globe className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                              <span>{r.roleName}</span>
                              {siteName && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                  ({siteName})
                                </span>
                              )}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        user.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : user.status === 'suspended'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          user.status === 'active'
                            ? 'bg-emerald-500 animate-pulse'
                            : user.status === 'suspended'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                        }`}
                      />
                      <span className="capitalize">{user.status}</span>
                    </span>
                  </td>

                  {/* Last Login Date */}
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                    {user.lastLoginAt ? (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="size-3.5 text-slate-500 dark:text-slate-400" />
                        <span>{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">
                          {new Date(user.lastLoginAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                        Never
                      </span>
                    )}
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Quick Edit */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => onEditUser(user)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                          title="Quick Edit Profile"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      )}

                      {/* Status Toggle (Suspend / Activate) */}
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(user)}
                          disabled={isDeactivationLocked}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDeactivationLocked
                              ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                              : user.status === 'active'
                                ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                          }`}
                          title={
                            isDeactivationLocked
                              ? 'Protected Super Admin'
                              : user.status === 'active'
                                ? 'Suspend User'
                                : 'Activate User'
                          }
                        >
                          {user.status === 'active' ? (
                            <Lock className="size-3.5" />
                          ) : (
                            <Unlock className="size-3.5" />
                          )}
                        </button>
                      )}

                      {/* Full Detail Page Link */}
                      <Link
                        href={`/users/${user.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                      >
                        <span>{t.users.manageUser || 'Manage'}</span>
                        <ChevronRight className="size-3 text-slate-500 dark:text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
