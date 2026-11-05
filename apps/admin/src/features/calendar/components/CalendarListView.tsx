'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Send,
  XCircle,
  FileEdit,
  RotateCcw,
} from 'lucide-react';
import type { CalendarEvent } from '../types';
import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { formatDateTime, type Locale } from '@/lib/i18n';

interface CalendarListViewProps {
  events: CalendarEvent[];
  locale: Locale;
  timezone: string;
  onAction: (event: CalendarEvent, action: PublishingActionType) => void;
}

export function CalendarListView({
  events,
  locale,
  timezone,
  onAction,
}: CalendarListViewProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-2xs">
        <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No scheduled or published articles
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No publications match the current filters. Select another month or use the button above to
          schedule content.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {events.map((ev) => {
          const isScheduled = ev.status === 'scheduled';
          const isPublished = ev.status === 'published';

          return (
            <div
              key={ev.id}
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              {/* Event info */}
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    isScheduled
                      ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                      : isPublished
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isScheduled ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/posts/${ev.postId}/edit`}
                      className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 transition-colors"
                    >
                      {ev.title}
                    </Link>
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {ev.siteName}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isScheduled
                          ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                          : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono">
                      {formatDateTime(ev.date, locale, timezone)}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">/{ev.slug}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {isScheduled && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAction(ev, 'publish')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors"
                      title="Publish immediately"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction(ev, 'reschedule')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onAction(ev, 'cancelSchedule')}
                      className="p-1.5 rounded-lg text-xs font-semibold border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Cancel scheduled release"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}

                {isPublished && (
                  <button
                    type="button"
                    onClick={() => onAction(ev, 'unpublish')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                )}

                <Link
                  href={`/posts/${ev.postId}/edit`}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
