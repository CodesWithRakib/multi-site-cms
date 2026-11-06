'use client';

import { useMemo, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';

import { ArticleCard } from '@/components/cards/ArticleCard';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import type { PublicArticle, PublicCategory } from '@/lib/api';

interface DestinationsClientContainerProps {
  readonly initialGuides: readonly PublicArticle[];
  /** Real CMS topics; the filter tabs are built from these, never hardcoded. */
  readonly categories: readonly PublicCategory[];
}

const MAX_TABS = 7;

export function DestinationsClientContainer({
  initialGuides,
  categories,
}: DestinationsClientContainerProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const tabs = useMemo(
    () =>
      categories
        .filter((category) => category.postCount > 0)
        .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
        .slice(0, MAX_TABS),
    [categories],
  );

  const activeTab = tabs.find((tab) => tab.slug === activeSlug) ?? null;

  const filteredGuides = useMemo(
    () =>
      activeSlug
        ? initialGuides.filter((guide) =>
            guide.categories.some((category) => category.slug === activeSlug),
          )
        : initialGuides,
    [initialGuides, activeSlug],
  );

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-xs font-semibold transition-all ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;

  return (
    <div className="space-y-12">
      {tabs.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4"
          role="group"
          aria-label="Filter guides by topic"
        >
          <button
            type="button"
            aria-pressed={activeSlug === null}
            onClick={() => setActiveSlug(null)}
            className={tabClass(activeSlug === null)}
          >
            All Destinations
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeSlug === tab.slug}
              onClick={() => setActiveSlug(tab.slug)}
              className={tabClass(activeSlug === tab.slug)}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide, idx) => (
            <ArticleCard key={guide.id} article={guide} variant="standard" priority={idx === 0} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-3xl border border-dashed border-border p-10 text-center sm:p-16">
          <Compass aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
          <h3 className="font-serif text-xl font-bold text-foreground">
            {activeTab ? `No guides in ${activeTab.name} yet` : 'No guides published yet'}
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {activeTab
              ? 'Try another topic, or browse every guide.'
              : 'New destination guides will appear here as soon as they are published.'}
          </p>
          {activeTab && (
            <button
              type="button"
              onClick={() => setActiveSlug(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <MapPin aria-hidden="true" className="size-3.5" /> View All Destinations
            </button>
          )}
        </div>
      )}

      <div className="pt-8">
        <NewsletterBanner />
      </div>
    </div>
  );
}
