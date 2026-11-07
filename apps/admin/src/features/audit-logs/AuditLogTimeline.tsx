'use client';

import React from 'react';
import {
  KeyRound,
  FileEdit,
  Trash2,
  Clock,
  ExternalLink,
  Terminal,
  User,
  CheckCircle2,
} from 'lucide-react';
import type { AuditLogItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';
import { describeAuditAction } from './action-labels';

interface AuditLogTimelineProps {
  logs: AuditLogItem[];
  onSelectLog: (log: AuditLogItem) => void;
  isLoading: boolean;
}

function getTimelineActionConfig(action: string) {
  if (action.includes('delete') || action.includes('failed')) {
    return {
      icon: Trash2,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dotColor: 'bg-rose-500 ring-rose-500/20',
    };
  }
  if (action.startsWith('auth.') || action.startsWith('role.')) {
    return {
      icon: KeyRound,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dotColor: 'bg-amber-500 ring-amber-500/20',
    };
  }
  if (action.includes('status') || action.includes('schedule')) {
    return {
      icon: CheckCircle2,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      dotColor: 'bg-indigo-500 ring-indigo-500/20',
    };
  }
  return {
    icon: FileEdit,
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    dotColor: 'bg-emerald-500 ring-emerald-500/20',
  };
}

export function AuditLogTimeline({ logs, onSelectLog, isLoading }: AuditLogTimelineProps) {
  const { t, locale } = useAdmin();

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`timeline-skel-${i}`} className="animate-pulse flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-md w-1/3" />
              <div className="h-12 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center text-neutral-400 shadow-xs">
        {t('auditLogs.noLogsFound')}
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs overflow-hidden flex flex-col">
      <div className="p-6 relative">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[39px] top-8 bottom-8 w-0.5 bg-neutral-200 dark:bg-neutral-800" />

        <div className="space-y-6">
          {logs.map((log) => {
            const config = getTimelineActionConfig(log.action);
            const ActionIcon = config.icon;
            const metaEntries = Object.entries(log.metadata || {}).slice(0, 3);

            return (
              <div
                key={log.id}
                onClick={() => onSelectLog(log)}
                className="relative flex items-start gap-4 group cursor-pointer"
              >
                {/* Node icon on timeline */}
                <div
                  className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white shadow-xs ring-4 ring-white dark:ring-neutral-900 ${config.dotColor}`}
                >
                  <ActionIcon className="w-3.5 h-3.5" />
                </div>

                {/* Event Details Card */}
                <div className="flex-1 p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-emerald-500/40 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        title={log.action}
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${config.badgeColor}`}
                      >
                        {describeAuditAction(log.action, locale).label}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-200/70 dark:bg-neutral-700/60 text-neutral-700 dark:text-neutral-300 capitalize">
                        {log.entityType}
                      </span>
                      {log.siteName && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                          {log.siteName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(log.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">•</span>
                      <span>
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actor details */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-700 dark:text-neutral-200 shrink-0">
                        {log.actorType === 'system' ? (
                          <Terminal className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                      </div>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {log.actorName ||
                          (log.actorType === 'system' ? 'System Service' : 'Bootstrap')}
                      </span>
                      {log.actorEmail && (
                        <span className="text-neutral-500 font-mono">({log.actorEmail})</span>
                      )}
                      {log.ipAddress && (
                        <span className="hidden sm:inline font-mono text-[11px] text-neutral-500">
                          IP: {log.ipAddress}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Metadata quick preview snippet if available */}
                  {metaEntries.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex flex-wrap gap-2 text-[11px]">
                      {metaEntries.map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono"
                        >
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                            {k}:
                          </span>{' '}
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
