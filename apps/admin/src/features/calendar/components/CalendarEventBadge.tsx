'use client';

import React from 'react';
import { Clock, CheckCircle2, FileText, Archive } from 'lucide-react';
import type { CalendarEvent } from '../types';

interface CalendarEventBadgeProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
  timezone?: string;
}

export function CalendarEventBadge({ event, onClick, timezone = 'UTC' }: CalendarEventBadgeProps) {
  const timeFormatted = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(event.date);

  const getStatusStyle = () => {
    switch (event.status) {
      case 'scheduled':
        return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60';
      case 'published':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60';
      case 'draft':
      case 'in_review':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100';
    }
  };

  const getStatusIcon = () => {
    switch (event.status) {
      case 'scheduled':
        return <Clock className="w-3 h-3 shrink-0 text-indigo-500" />;
      case 'published':
        return <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />;
      case 'draft':
      case 'in_review':
        return <FileText className="w-3 h-3 shrink-0 text-amber-500" />;
      default:
        return <Archive className="w-3 h-3 shrink-0 text-slate-400" />;
    }
  };

  const siteAbbr = event.siteName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={`group w-full text-left p-1.5 rounded-lg text-[11px] font-medium border shadow-2xs transition-all duration-150 flex items-center gap-1.5 ${getStatusStyle()}`}
      title={`${event.title} • ${event.status.toUpperCase()} • ${timeFormatted} (${event.siteName})`}
    >
      {getStatusIcon()}
      <span className="font-mono text-[9px] font-bold opacity-80 shrink-0">
        {timeFormatted}
      </span>
      <span className="truncate flex-1 font-semibold">{event.title}</span>
      <span className="shrink-0 text-[8px] font-bold px-1 py-0.2 rounded bg-black/5 dark:bg-white/10 uppercase">
        {siteAbbr}
      </span>
    </button>
  );
}

