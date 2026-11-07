import Link from 'next/link';
import { ArrowUpRight, CalendarClock } from 'lucide-react';

import type { PublicEventSummary } from '@multi-site-cms/types';

import { formatEventWindow } from '@/lib/format';

interface EventsPanelProps {
  readonly events: readonly PublicEventSummary[];
}

/** Live and upcoming CMS events, shown as a glass panel on the dark hero. */
export function EventsPanel({ events }: EventsPanelProps) {
  return (
    <aside
      aria-labelledby="events-panel-heading"
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl motion-safe:animate-rise [animation-delay:350ms] lg:w-88"
    >
      <div className="flex items-center justify-between">
        <h2
          id="events-panel-heading"
          className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/60"
        >
          On the radar
        </h2>
        <Link
          href="/events"
          className="touch-target inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-white"
        >
          All events
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
          <CalendarClock aria-hidden="true" className="size-4" />
          No live or scheduled events right now.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.slug}`}
                className="group flex items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white group-hover:text-brand-200">
                    {event.name}
                  </span>
                  <span className="font-mono text-xs text-white/55">
                    {formatEventWindow(event)}
                    {event.updateCount > 0 && ` · ${event.updateCount} updates`}
                  </span>
                </span>
                {event.status === 'live' ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-300">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full rounded-full bg-rose-400 opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-rose-400" />
                    </span>
                    Live
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white/70">
                    Soon
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
