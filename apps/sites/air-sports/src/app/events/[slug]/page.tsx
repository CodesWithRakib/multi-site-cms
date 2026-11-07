import React from 'react';
import { JsonLd } from '@multi-site-cms/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Radio, Trophy, Zap } from 'lucide-react';

import { LiveTimelineItem } from '@/components/timeline/LiveTimelineItem';
import { siteConfig, defaultOgImage } from '@/config/site';
import { fetchEventBySlug } from '@/lib/api';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);

  if (!event) {
    return {
      title: 'Event Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${event.name} — Live Hub`;
  const description =
    event.description || `Official live coverage, updates, and telemetry from ${event.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/events/${event.slug}`,
    },
    openGraph: {
      images: [defaultOgImage],
      type: 'website',
      url: `/events/${event.slug}`,
      siteName: siteConfig.name,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const startDate = new Date(event.startsAt);
  const startFormatted = startDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const endDate = event.endsAt ? new Date(event.endsAt) : null;
  const endFormatted = endDate
    ? endDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

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

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || event.name,
    startDate: event.startsAt,
    endDate: event.endsAt || undefined,
    eventStatus:
      event.status === 'live'
        ? 'https://schema.org/EventMovedOnline'
        : event.status === 'cancelled'
          ? 'https://schema.org/EventCancelled'
          : 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <JsonLd data={eventJsonLd} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/events" className="hover:text-primary transition-colors">
            Events Hub
          </Link>
          <span>/</span>
          <span className="text-foreground">{event.slug}</span>
        </nav>

        {/* Event Header Banner */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs mb-12">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider ${statusConfig.color}`}
            >
              {statusConfig.ping && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
              )}
              {statusConfig.label}
            </span>

            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Radio className="size-3.5 text-primary" />
              {event.updateCount} Published Update{event.updateCount === 1 ? '' : 's'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
            {event.name}
          </h1>

          {event.description && (
            <p className="mt-4 text-base sm:text-lg text-foreground/85 leading-relaxed font-sans max-w-3xl">
              {event.description}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-6 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Calendar className="size-3.5 text-primary" />
              Dates: {startFormatted} {endFormatted ? `— ${endFormatted}` : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-primary" />
              Sanctioned Competition Hub
            </span>
          </div>
        </div>

        {/* Live Timeline Updates Attached to this Event */}
        <section aria-labelledby="event-timeline-heading">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border">
            <Zap className="size-4 text-primary" />
            <h2
              id="event-timeline-heading"
              className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
            >
              Event Dispatches & Live Timeline ({event.updates.length})
            </h2>
          </div>

          {event.updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
              <Radio className="mx-auto size-8 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">No Dispatches Posted Yet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Live heats, results, and wind advisories for this competition will appear here once
                published.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {event.updates.map((update, idx) => (
                <LiveTimelineItem
                  key={update.id || update.slug}
                  article={update}
                  isLatest={idx === 0}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
