import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Radio } from 'lucide-react';
import type { PublicEventSummary } from '@multi-site-cms/types';

interface EventCardProps {
  event: PublicEventSummary;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startsAt);
  const startFormatted = startDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const statusConfig = {
    live: {
      label: 'Live Now',
      color: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      ping: true,
    },
    scheduled: {
      label: 'Upcoming',
      color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
      ping: false,
    },
    completed: {
      label: 'Official Results',
      color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
      ping: false,
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-stone-500/15 text-stone-600 border-stone-500/30',
      ping: false,
    },
  }[event.status] || {
    label: event.status,
    color: 'bg-muted text-muted-foreground border-border',
    ping: false,
  };

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-foreground/30 hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider ${statusConfig.color}`}
          >
            {statusConfig.ping && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
              </span>
            )}
            {statusConfig.label}
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <Radio className="size-3 text-primary" />
            {event.updateCount} update{event.updateCount === 1 ? '' : 's'}
          </span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
          <Link
            href={`/events/${event.slug}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {event.name}
          </Link>
        </h3>

        {event.description && (
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50 text-xs font-mono text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5 text-primary" />
          {startFormatted}
        </span>

        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1 font-sans font-bold text-primary group-hover:translate-x-0.5 transition-transform"
        >
          Event Hub
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
