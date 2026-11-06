'use client';

import React from 'react';
import { CalendarClock, FileText, Pencil, Trash2 } from 'lucide-react';
import type { EventItem, EventStatus } from '@multi-site-cms/types';

import { EVENT_STATUS_OPTIONS } from '../utils/event-form';

const STATUS_STYLES: Record<EventStatus, string> = {
  scheduled:
    'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800',
  live: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-800',
  completed:
    'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  cancelled:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800',
};

const statusLabel = (status: EventStatus) =>
  EVENT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatRange(event: EventItem): string {
  const start = dateFormat.format(new Date(event.startsAt));
  return event.endsAt ? `${start} → ${dateFormat.format(new Date(event.endsAt))}` : start;
}

interface EventListProps {
  readonly events: readonly EventItem[];
  readonly canManage: boolean;
  readonly onEdit: (event: EventItem) => void;
  readonly onDelete: (event: EventItem) => void;
}

export function EventList({ events, canManage, onEdit, onDelete }: EventListProps) {
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
              <CalendarClock className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                  {event.name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATUS_STYLES[event.status]}`}
                >
                  {statusLabel(event.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {formatRange(event)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="font-mono">/events/{event.slug}</span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="size-3" aria-hidden="true" />
                  {event.publicationCount} linked {event.publicationCount === 1 ? 'post' : 'posts'}
                </span>
              </p>
              {event.description && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(event)}
                aria-label={`Delete ${event.name}`}
                className="inline-flex items-center rounded-xl border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
