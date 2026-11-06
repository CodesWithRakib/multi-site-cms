import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Radio, Trophy } from 'lucide-react';

import { EventCard } from '@/components/events/EventCard';
import { siteConfig } from '@/config/site';
import { fetchEvents } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Events & Festivals',
  description:
    'Upcoming and past air sports events, festivals and meets, with every related dispatch.',
  alternates: {
    canonical: '/events',
  },
  openGraph: {
    title: `Events & Festivals | ${siteConfig.name}`,
    description:
      'Upcoming and past air sports events, festivals and meets, with every related dispatch.',
    url: '/events',
  },
};

export default async function EventsIndexPage() {
  const events = await fetchEvents();

  const liveEvents = events.filter((e) => e.status === 'live');
  const upcomingEvents = events.filter((e) => e.status === 'scheduled');
  const completedEvents = events.filter((e) => e.status === 'completed');

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground">Events</span>
        </nav>

        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Events
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Events & Festivals
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground font-sans">
            Festivals, meets and competitions we cover. Each event page collects every dispatch
            published about it.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
            <Radio className="mx-auto size-12 text-muted-foreground/40 mb-3" />
            <h2 className="text-lg font-bold text-foreground">No events yet</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Events appear here as soon as they are announced.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Live Events Section */}
            {liveEvents.length > 0 && (
              <section aria-labelledby="live-events-heading">
                <div className="flex items-center gap-2 mb-6">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                  </span>
                  <h2
                    id="live-events-heading"
                    className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
                  >
                    Live Now ({liveEvents.length})
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {liveEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming Events Section */}
            {upcomingEvents.length > 0 && (
              <section aria-labelledby="upcoming-events-heading">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="size-4 text-primary" />
                  <h2
                    id="upcoming-events-heading"
                    className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
                  >
                    Upcoming ({upcomingEvents.length})
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Events Section */}
            {completedEvents.length > 0 && (
              <section aria-labelledby="completed-events-heading">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="size-4 text-muted-foreground" />
                  <h2
                    id="completed-events-heading"
                    className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
                  >
                    Past events ({completedEvents.length})
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {completedEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
