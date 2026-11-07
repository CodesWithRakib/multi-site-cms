import { BookOpen, CalendarClock, Compass, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import type { HomeStats } from '@/lib/home-feed';

interface Cell {
  readonly label: string;
  readonly value: number;
  readonly icon: LucideIcon;
  /** Pulse the value while something is happening right now. */
  readonly live?: boolean;
}

/**
 * Instrument strip under the hero. Every figure is counted from published CMS
 * data (never typed in), so it moves as dispatches and events are added.
 */
export function TelemetryBar({ stats }: { readonly stats: HomeStats }) {
  const cells: readonly Cell[] = [
    { label: 'Dispatches', value: stats.dispatches, icon: BookOpen },
    { label: 'Live now', value: stats.liveEvents, icon: Radio, live: stats.liveEvents > 0 },
    { label: 'Upcoming', value: stats.upcomingEvents, icon: CalendarClock },
    { label: 'Disciplines', value: stats.disciplines, icon: Compass },
  ];

  return (
    <section aria-label="The site at a glance" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-4">
        {cells.map(({ label, value, icon: Icon, live }) => (
          <div key={label} className="flex items-center gap-3 bg-card px-4 py-4 sm:px-5">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                live ? 'bg-rose-500/15 text-rose-600' : 'bg-primary/10 text-primary',
              )}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <dd
                className={cn(
                  'font-mono text-2xl font-bold leading-none tabular-nums text-foreground',
                  live && 'text-rose-600',
                )}
              >
                {value}
              </dd>
              <dt className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px] sm:tracking-[0.18em]">
                {label}
              </dt>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
