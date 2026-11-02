'use client';

import React, { useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react';
import { useGetPublishingHealthQuery } from '@/lib/cms-api';

export function PublishingHealthBadge() {
  const { data: health, isLoading, isError } = useGetPublishingHealthQuery(undefined, {
    pollingInterval: 30000,
  });
  const [open, setOpen] = useState(false);

  if (isLoading || isError || !health) {
    return null;
  }

  const isHealthy =
    health.isScheduledWorkerActive &&
    health.isOutboxDispatcherActive &&
    health.outboxDeadLetterCount === 0;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
          isHealthy
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
        }`}
        title="Publishing engine health and worker queues"
      >
        <span className="relative flex h-2 w-2">
          {isHealthy && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>
        <Activity className="w-3.5 h-3.5" />
        <span>Scheduler Engine</span>
        {health.scheduledPublicationsPending > 0 && (
          <span className="ml-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.2 text-[10px] font-bold">
            {health.scheduledPublicationsPending}
          </span>
        )}
        <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 p-4 shadow-xl border border-slate-200 dark:border-slate-800 z-30 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                Publishing Engine Status
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}
              >
                {isHealthy ? 'Healthy' : 'Attention'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Scheduled Worker:</span>
                <span className="font-semibold flex items-center gap-1">
                  {health.isScheduledWorkerActive ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {health.isScheduledWorkerActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Outbox Dispatcher:</span>
                <span className="font-semibold flex items-center gap-1">
                  {health.isOutboxDispatcherActive ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {health.isOutboxDispatcherActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Scheduled in Queue:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {health.scheduledPublicationsPending}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Outbox Backlog:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {health.outboxBacklogPending}
                </span>
              </div>
              {health.outboxDeadLetterCount > 0 && (
                <div className="flex justify-between items-center py-1 text-red-600 dark:text-red-400">
                  <span>Dead Letter Queue:</span>
                  <span className="font-mono font-bold">{health.outboxDeadLetterCount}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

