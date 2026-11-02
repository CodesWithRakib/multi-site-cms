import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Calendar, Clock, Radio, Trophy } from 'lucide-react';
import type { PublicArticleSummary, PublicEventSummary } from '@multi-site-cms/types';

interface LiveDispatchesSectionProps {
  articles: PublicArticleSummary[];
  events: PublicEventSummary[];
}

export function LiveDispatchesSection({
  articles,
  events,
}: LiveDispatchesSectionProps) {
  const displayArticles = articles.slice(0, 4);
  const activeEvents = events.slice(0, 2);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8" id="dispatches">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Flight Telemetry & Dispatches
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Latest Air Sports Coverage
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Breaking reports, world records, and equipment analyses directly from race controllers.
          </p>
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span>Active Events Hub</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8-Column Articles Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {displayArticles.map((article) => {
            const formattedDate = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent';

            const categoryName = article.categories[0]?.name ?? 'Air Sports';

            return (
              <article
                key={article.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                    <Image
                      src={
                        article.featuredImage?.url ??
                        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={article.featuredImage?.altText || article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-sky-600/90 px-3 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                      {categoryName}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-2">
                    <h3 className="line-clamp-2 text-base font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                    </h3>
                    {article.excerpt && (
                      <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{article.readingTimeMinutes}m</span>
                  </div>

                  <Link
                    href={`/articles/${article.slug}`}
                    aria-label={`Read ${article.title}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-foreground transition group-hover:bg-sky-600 group-hover:text-white"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right 4-Column Active Competitions Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-foreground">Flight Competitions</h3>
            </div>

            {activeEvents.length > 0 ? (
              <div className="space-y-3">
                {activeEvents.map((evt) => (
                  <Link
                    key={evt.id}
                    href={`/events/${evt.slug}`}
                    className="group block rounded-xl border border-border/60 bg-muted/40 p-3.5 transition hover:border-sky-500/40 hover:bg-muted"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                        {evt.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {evt.startsAt ? new Date(evt.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Upcoming'}
                      </span>
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {evt.name}
                    </h4>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No active races right now.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
