import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { DestinationsClientContainer } from '@/components/destinations/DestinationsClientContainer';
import { siteConfig, defaultOgImage } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Destination Guides — Plan Your Next Trip',
  description:
    'In-depth itineraries, practical field notes, and cultural orientation for your next route.',
  alternates: {
    canonical: '/destinations',
  },
  openGraph: {
    images: [defaultOgImage],
    title: `Destination Guides | ${siteConfig.name}`,
    description: 'In-depth itineraries and practical orientation for your next route.',
    url: '/destinations',
  },
};

export default async function DestinationsPage() {
  const [data, categories] = await Promise.all([fetchArticles({ limit: 24 }), fetchCategories()]);
  const guides = data.items;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      {/* Page Header */}
      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <MapPin className="h-3.5 w-3.5" /> Curated Field Notes & Routes
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Destination Guides
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Comprehensive, field-tested guides covering route planning, cultural etiquette, transit
          logistics, and local insights for your next trip.
        </p>
      </header>

      {/* Interactive Destination Explorer Container */}
      <DestinationsClientContainer initialGuides={guides} categories={categories} />
    </div>
  );
}
