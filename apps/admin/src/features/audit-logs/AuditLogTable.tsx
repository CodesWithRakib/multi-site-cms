'use client';

import React from 'react';
import { Eye, User, Terminal } from 'lucide-react';
import type { AuditLogItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';
import { describeAuditAction } from './action-labels';

interface AuditLogTableProps {
  logs: AuditLogItem[];
  onSelectLog: (log: AuditLogItem) => void;
  isLoading: boolean;
}

export function AuditLogTable({ logs, onSelectLog, isLoading }: AuditLogTableProps) {
  const { t, locale } = useAdmin();

  const getActionBadgeClass = (action: string) => {
    if (action.includes('delete') || action.includes('failed'))
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    if (action.startsWith('auth.') || action.startsWith('role.'))
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (action.includes('status') || action.includes('schedule'))
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (action.startsWith('media.'))
      return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (action.startsWith('post.') || action.startsWith('publication.'))
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
  };

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <th className="py-3 px-4">{t('auditLogs.action')}</th>
              <th className="py-3 px-4">{t('auditLogs.actor')}</th>
              <th className="py-3 px-4">{t('auditLogs.entity')}</th>
              <th className="py-3 px-4">{t('auditLogs.site')}</th>
              <th className="py-3 px-4">{t('auditLogs.ipAddress')}</th>
              <th className="py-3 px-4">{t('auditLogs.timestamp')}</th>
              <th className="py-3 px-4 text-right">{t('auditLogs.details')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td colSpan={7} className="py-3.5 px-4">
                    <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500">
                  {t('auditLogs.noLogsFound')}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                >
                  {/* Action */}
                  <td className="py-3 px-4 text-xs">
                    <span
                      title={log.action}
                      className={`inline-block px-2 py-0.5 rounded-md font-medium border ${getActionBadgeClass(
                        log.action,
                      )}`}
                    >
                      {describeAuditAction(log.action, locale).label}
                    </span>
                  </td>

                  {/* Actor */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center shrink-0 text-neutral-600 dark:text-neutral-300 text-xs">
                        {log.actorType === 'system' ? (
                          <Terminal className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {log.actorName ||
                            (log.actorType === 'system' ? 'System' : 'Bootstrap System')}
                        </p>
                        {log.actorEmail && (
                          <p className="text-[11px] text-neutral-500 truncate">{log.actorEmail}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Entity */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 capitalize">
                      {log.entityType}
                    </span>
                  </td>

                  {/* Site Scope */}
                  <td className="py-3 px-4">
                    {log.siteName ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {log.siteName}
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-500">Platform Global</span>
                    )}
                  </td>

                  {/* IP Address */}
                  <td className="py-3 px-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                    {log.ipAddress || '—'}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 text-xs whitespace-nowrap">
                    <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>

                  {/* View Button */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center"
                      title={t('auditLogs.viewMetadata')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
