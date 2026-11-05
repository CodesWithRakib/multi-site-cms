'use client';

import React, { useMemo, useState } from 'react';
import type { PublicArticle } from '@/lib/api';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { Compass, MapPin } from 'lucide-react';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';

interface DestinationsClientContainerProps {
  initialGuides: PublicArticle[];
}

const REGION_TABS = [
  { label: 'All Destinations', key: 'all' },
  { label: 'Europe', key: 'europe' },
  { label: 'Asia', key: 'asia' },
  { label: 'America', key: 'america' },
  { label: 'Middle East', key: 'middle-east' },
  { label: 'Adventure', key: 'adventure' },
];

export function DestinationsClientContainer({ initialGuides }: DestinationsClientContainerProps) {
  const [activeRegion, setActiveRegion] = useState('all');

  const filteredGuides = useMemo(() => {
    if (activeRegion === 'all') return initialGuides;
    return initialGuides.filter(
      (guide) =>
        guide.categories.some((cat) => cat.slug.toLowerCase().includes(activeRegion)) ||
        guide.title.toLowerCase().includes(activeRegion) ||
        guide.tags.some((t) => t.slug.toLowerCase().includes(activeRegion)),
    );
  }, [initialGuides, activeRegion]);

  return (
    <div className="space-y-12">
      {/* Interactive Region Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
        {REGION_TABS.map((tab) => {
          const isActive = activeRegion === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveRegion(tab.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Guides Grid */}
      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGuides.map((guide, idx) => (
            <ArticleCard key={guide.id} article={guide} variant="standard" priority={idx === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
          <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-serif text-xl font-bold text-foreground">
            No Destinations Found for &ldquo;{activeRegion}&rdquo;
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Try switching to &ldquo;All Destinations&rdquo; to explore all our field-tested
            itineraries.
          </p>
          <button
            type="button"
            onClick={() => setActiveRegion('all')}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition"
          >
            <MapPin className="h-3.5 w-3.5" /> View All Destinations
          </button>
        </div>
      )}

      {/* Newsletter */}
      <div className="pt-8">
        <NewsletterBanner />
      </div>
    </div>
  );
}
