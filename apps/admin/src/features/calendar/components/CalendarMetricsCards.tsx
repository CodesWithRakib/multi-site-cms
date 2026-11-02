'use client';

import React from 'react';
import { Calendar, Clock, CheckCircle2, Cpu } from 'lucide-react';
import type { CalendarEvent } from '../types';

interface CalendarMetricsCardsProps {
  events: CalendarEvent[];
  scheduledPendingCount?: number;
}

export function CalendarMetricsCards({
  events,
  scheduledPendingCount = 0,
}: CalendarMetricsCardsProps) {
  const scheduledCount = events.filter((e) => e.status === 'scheduled').length;
  const publishedCount = events.filter((e) => e.status === 'published').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Calendar Events */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-blue-500 to-blue-600">
            <Calendar className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Publications
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {events.length}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Scheduled Articles */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-indigo-500 to-indigo-600">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Scheduled Releases
            </span>
            <h3 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {scheduledCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Published Articles */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-emerald-500 to-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Published on Sites
            </span>
            <h3 className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {publishedCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 4. Engine Queue Status */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-teal-500 to-cyan-600">
            <Cpu className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Scheduler Queue
            </span>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {scheduledPendingCount}
              </h3>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
