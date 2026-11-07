import Link from 'next/link';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

import type { PublicEventSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { formatDateTile, formatEventWindow } from '@/lib/format';

/**
 * Departure-board style list of live and upcoming events: a calendar tile, the
 * name and window, and a status. Hidden when there is nothing to list (the hero
 * already says so).
 */
export function ScheduleBoard({ events }: { readonly events: readonly PublicEventSummary[] }) {
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="schedule-heading" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="dark overflow-hidden rounded-3xl bg-neutral-950 text-white ring-1 ring-white/10 [color-scheme:dark]">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <h2
              id="schedule-heading"
              className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-white/70"
            >
              Flight schedule
            </h2>
            <p className="mt-1 text-sm text-white/55">Live and upcoming events</p>
          </div>
          <Link
            href="/events"
            className="touch-target inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-300 hover:text-white"
          >
            All events
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <ol className="divide-y divide-white/10">
          {events.map((event) => {
            const tile = formatDateTile(event.startsAt);
            const live = event.status === 'live';
            return (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-white/5 sm:gap-6 sm:px-7 sm:py-5"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex size-16 flex-col items-center justify-center rounded-2xl font-mono',
                      live ? 'bg-rose-500/15 text-rose-200' : 'bg-white/10 text-white',
                    )}
                  >
                    <span className="text-2xl font-bold leading-none tabular-nums">{tile.day}</span>
                    <span className="mt-1 text-[11px] font-semibold tracking-[0.2em] text-white/60">
                      {tile.month}
                    </span>
                  </span>

                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-base font-bold leading-snug text-white group-hover:text-brand-200 sm:text-lg">
                      {event.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-white/55">
                      {formatEventWindow(event)}
                      {event.updateCount > 0 &&
                        ` · ${event.updateCount} ${event.updateCount === 1 ? 'update' : 'updates'}`}
                    </span>
                    {event.description && (
                      <span className="mt-1 hidden line-clamp-1 text-sm text-white/60 sm:block">
                        {event.description}
                      </span>
                    )}
                  </span>

                  <span className="flex items-center gap-3">
                    {live ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex size-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-rose-400" />
                        </span>
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white/70">
                        Soon
                      </span>
                    )}
                    <ChevronRight
                      aria-hidden="true"
                      className="hidden size-5 text-white/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white sm:block"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
