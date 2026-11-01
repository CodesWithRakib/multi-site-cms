'use client';

import React, { useState } from 'react';
import type { PublicArticleSummary } from '@multi-site-cms/types';
import { RealtimeStatusBar } from '../realtime/RealtimeStatusBar';
import { useRealtimeStream } from '../realtime/useRealtimeStream';
import { LiveTimelineItem } from './LiveTimelineItem';
import { Radio } from 'lucide-react';

interface LiveTimelineProps {
  initialArticles: PublicArticleSummary[];
  title?: string;
  description?: string;
  maxItems?: number;
}

export function LiveTimeline({
  initialArticles,
  title = 'Live Updates & Race Telemetry',
  description = 'Real-time dispatched updates from event desks, pilots, and controllers.',
  maxItems = 30,
}: LiveTimelineProps) {
  const { articles, status, lastPing, liveAnnouncement, refreshManually } = useRealtimeStream({
    initialArticles,
    maxTimelineItems: maxItems,
  });

  const [visibleCount, setVisibleCount] = useState<number>(10);

  const displayedArticles = articles.slice(0, visibleCount);

  return (
    <section aria-labelledby="live-timeline-heading" className="my-8">
      {/* Live Region for Screen Readers */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Header with Title and Realtime Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <h2
              id="live-timeline-heading"
              className="text-2xl font-black uppercase tracking-tight text-foreground"
            >
              {title}
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">{description}</p>
        </div>

        <RealtimeStatusBar status={status} lastPing={lastPing} onRefresh={refreshManually} />
      </div>

      {/* Empty State */}
      {displayedArticles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
          <Radio className="mx-auto size-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-foreground">No Live Updates Dispatched</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Live updates and timeline dispatches will appear here automatically as soon as event
            controllers transmit them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedArticles.map((article, idx) => (
            <LiveTimelineItem
              key={article.id || article.slug}
              article={article}
              isLatest={idx === 0}
            />
          ))}

          {articles.length > visibleCount && (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(articles.length, prev + 10))}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-foreground hover:bg-muted hover:border-foreground/30 transition-colors shadow-xs"
              >
                Load Older Updates ({articles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
