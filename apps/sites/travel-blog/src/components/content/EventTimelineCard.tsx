import React from 'react';
import { Clock, Info, ShieldAlert, Wind } from 'lucide-react';

export interface EventTimelineCardProps {
  time?: string;
  title?: string;
  description?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'delayed' | 'cancelled';
  windSpeed?: string;
  weatherCondition?: string;
  alertLevel?: 'normal' | 'advisory' | 'warning';
}

export function EventTimelineCard({
  time = '00:00',
  title = 'Timeline Event',
  description,
  status = 'scheduled',
  windSpeed,
  weatherCondition,
  alertLevel = 'normal',
}: EventTimelineCardProps) {
  const isWarning = alertLevel === 'warning';
  const isAdvisory = alertLevel === 'advisory';

  const badgeColor =
    status === 'live'
      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
      : status === 'completed'
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        : status === 'delayed' || status === 'cancelled'
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
          : 'bg-muted text-muted-foreground border-border';

  const cardBorder = isWarning
    ? 'border-amber-500/40 bg-amber-500/5'
    : isAdvisory
      ? 'border-blue-500/40 bg-blue-500/5'
      : 'border-border/80 bg-card';

  return (
    <aside
      className={`my-6 rounded-xl border p-5 shadow-xs font-sans transition-all ${cardBorder}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-foreground/10 text-foreground">
            <Clock className="size-3 text-emerald-600 dark:text-emerald-400" />
            {time}
          </span>
          <h4 className="text-base font-bold text-foreground">{title}</h4>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${badgeColor}`}
        >
          {status}
        </span>
      </div>

      {description && (
        <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{description}</p>
      )}

      {(windSpeed || weatherCondition || alertLevel !== 'normal') && (
        <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
          {windSpeed && (
            <span className="flex items-center gap-1">
              <Wind className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              Wind: <strong className="text-foreground">{windSpeed}</strong>
            </span>
          )}
          {weatherCondition && (
            <span className="flex items-center gap-1">
              <Info className="size-3.5 text-blue-500" />
              Weather: <strong className="text-foreground">{weatherCondition}</strong>
            </span>
          )}
          {alertLevel !== 'normal' && (
            <span className="flex items-center gap-1 text-amber-600 font-bold uppercase">
              <ShieldAlert className="size-3.5" />
              Alert: {alertLevel}
            </span>
          )}
        </div>
      )}
    </aside>
  );
}
