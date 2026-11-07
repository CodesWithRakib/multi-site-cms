'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import type { CalendarDayCell, CalendarEvent } from '../types';
import { CalendarEventBadge } from './CalendarEventBadge';

interface CalendarMonthGridProps {
  days: CalendarDayCell[];
  timezone?: string;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Phones show one dot per publication; tapping the day opens the scheduler. */
const MAX_DOTS = 3;

function statusDotClass(status: CalendarEvent['status']): string {
  switch (status) {
    case 'scheduled':
      return 'bg-indigo-500';
    case 'published':
      return 'bg-emerald-500';
    case 'draft':
    case 'in_review':
      return 'bg-amber-500';
    default:
      return 'bg-slate-400';
  }
}

export function CalendarMonthGrid({
  days,
  timezone = 'UTC',
  onEventClick,
  onDateClick,
}: CalendarMonthGridProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
      <div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center py-2.5">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20">
          {days.map((cell, idx) => {
            const displayedEvents = cell.events.slice(0, 3);
            const hiddenCount = cell.events.length - displayedEvents.length;

            return (
              <div
                key={idx}
                onClick={() => onDateClick(cell.date)}
                className={`group min-h-16 sm:min-h-[120px] p-1 sm:p-2 flex flex-col justify-between transition-colors relative cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/30 ${
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-slate-50/40 dark:bg-slate-950/40 opacity-45'
                } ${cell.isToday ? 'ring-2 ring-emerald-500/30 dark:ring-emerald-500/40 bg-emerald-50/10' : ''}`}
              >
                {/* Day header */}
                <div className="flex items-center justify-center sm:justify-between mb-1 sm:mb-1.5">
                  <span
                    className={`text-xs font-bold ${
                      cell.isToday
                        ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-mono'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(cell.date);
                    }}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                    title="Schedule post on this date"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Event list */}
                {cell.events.length > 0 && (
                  <div
                    className="flex items-center justify-center gap-0.5 sm:hidden"
                    aria-label={`${cell.events.length} publication${cell.events.length === 1 ? '' : 's'}`}
                  >
                    {cell.events.slice(0, MAX_DOTS).map((ev) => (
                      <span
                        key={ev.id}
                        aria-hidden="true"
                        className={`size-1.5 rounded-full ${statusDotClass(ev.status)}`}
                      />
                    ))}
                  </div>
                )}

                <div className="hidden flex-1 space-y-1.5 overflow-hidden sm:block">
                  {displayedEvents.map((ev) => (
                    <CalendarEventBadge
                      key={ev.id}
                      event={ev}
                      onClick={onEventClick}
                      timezone={timezone}
                    />
                  ))}

                  {hiddenCount > 0 && (
                    <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 pt-0.5">
                      +{hiddenCount} more
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
