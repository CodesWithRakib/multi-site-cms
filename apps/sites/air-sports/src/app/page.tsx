import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Radio, Trophy, Zap } from 'lucide-react';

import { BreakingNewsBanner } from '@/components/breaking/BreakingNewsBanner';
import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { EventCard } from '@/components/events/EventCard';
import { LiveTimeline } from '@/components/timeline/LiveTimeline';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories, fetchEvents } from '@/lib/api';

export const revalidate = 30; // ISR 30s

export default async function AirSportsHomePage() {
  const [breakingRes, allArticlesRes, events, categories] = await Promise.all([
    fetchArticles({ templateKey: 'breaking', limit: 5 }),
    fetchArticles({ limit: 16 }),
    fetchEvents(),
    fetchCategories(),
  ]);

  const breakingArticles = breakingRes.items;
  const articles = allArticlesRes.items;

  const heroArticle = articles[0] || null;
  const secondaryArticles = articles.slice(1, 4);
  const reports = articles.slice(4);

  // Active / Live events
  const liveEvents = events.filter((e) => e.status === 'live');
  const upcomingEvents = events.filter((e) => e.status === 'scheduled');
  const displayEvents = [...liveEvents, ...upcomingEvents].slice(0, 4);

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/images/air-sports-logo.png`,
    sameAs: ['https://twitter.com/AirSportsLive', 'https://youtube.com/@AirSportsLive'],
  };

  return (
    <div className="min-h-screen">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Breaking News Ticker Banner */}
      <BreakingNewsBanner breakingArticles={breakingArticles} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Cockpit Radar Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                <Radio className="size-3.5" />
                Live Desk Telemetry
              </span>
              <span className="font-mono text-xs text-muted-foreground">Channel: AIR-01</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-foreground leading-none">
              High Velocity.
              <br />
              <span className="text-primary">Zero Latency.</span>
            </h1>
          </div>

          <p className="max-w-md text-sm leading-relaxed text-muted-foreground font-sans">
            Authoritative live reporting on paragliding cups, aerobatic circuits, drone racing, and
            human flight records directly from race controllers and observers.
          </p>
        </div>

        {/* Featured Story Hero */}
        {heroArticle ? (
          <section aria-labelledby="featured-story-heading" className="mb-12">
            <h2 id="featured-story-heading" className="sr-only">
              Featured Dispatch
            </h2>
            <AirSportsCard article={heroArticle} variant="hero" priority={true} />
          </section>
        ) : (
          <div className="mb-12 rounded-3xl border border-dashed border-border p-12 text-center bg-card">
            <Radio className="mx-auto size-10 text-muted-foreground/50 mb-3" />
            <h2 className="text-lg font-bold text-foreground">
              Waiting for Air Sports Transmissions
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              No articles or race updates have been published to the Air Sports live desk yet.
            </p>
          </div>
        )}

        {/* Categories Bar */}
        {categories.length > 0 && (
          <div className="mb-10 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 mr-2">
              Disciplines:
            </span>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-mono font-semibold text-foreground hover:border-primary hover:text-primary transition-colors shadow-xs"
              >
                {c.name} ({c.postCount})
              </Link>
            ))}
          </div>
        )}

        {/* 2-Column Main Layout: Live Timeline vs Events & Reports */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Update Stream (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8" id="live-feed">
            <LiveTimeline initialArticles={articles} />
          </div>

          {/* Right Column: Events & Spotlight Reports (5/4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            {/* Active Events Widget */}
            <section
              aria-labelledby="events-heading"
              className="rounded-3xl border border-border bg-card p-6 shadow-xs"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-primary" />
                  <h3
                    id="events-heading"
                    className="text-base font-bold uppercase tracking-tight text-foreground font-mono"
                  >
                    Active Competitions
                  </h3>
                </div>
                <Link
                  href="/events"
                  className="text-xs font-mono text-primary font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  All Hubs
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              {displayEvents.length > 0 ? (
                <div className="space-y-4">
                  {displayEvents.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-mono py-4 text-center">
                  No live championship events scheduled right now.
                </p>
              )}
            </section>

            {/* Top Coverage Dispatches */}
            {secondaryArticles.length > 0 && (
              <section
                aria-labelledby="dispatches-heading"
                className="rounded-3xl border border-border bg-card p-6 shadow-xs"
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <Zap className="size-4 text-primary" />
                  <h3
                    id="dispatches-heading"
                    className="text-base font-bold uppercase tracking-tight text-foreground font-mono"
                  >
                    Top Coverage
                  </h3>
                </div>

                <div className="divide-y divide-border/60">
                  {secondaryArticles.map((article) => (
                    <AirSportsCard key={article.id} article={article} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Extended Coverage Reports Grid */}
        {reports.length > 0 && (
          <section aria-labelledby="reports-heading" className="mt-16 pt-12 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  Archives & In-Depth Reports
                </span>
                <h2
                  id="reports-heading"
                  className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground"
                >
                  Aviation Desk Reports
                </h2>
              </div>
              <Link
                href="/categories"
                className="font-mono text-xs font-bold uppercase text-primary hover:underline inline-flex items-center gap-1"
              >
                Explore By Category →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <AirSportsCard key={report.id} article={report} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
