import type { Metadata } from 'next';
import { Compass, MapPin } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { siteConfig } from '@/config/site';
import { fetchArticles } from '@/lib/api';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Destination Guides',
  description:
    'In-depth itineraries, practical field notes, and cultural orientation for global routes.',
  alternates: {
    canonical: '/destinations',
  },
  openGraph: {
    title: `Destination Guides | ${siteConfig.name}`,
    description: 'In-depth itineraries and practical orientation for global routes.',
    url: '/destinations',
  },
};

export default async function DestinationsPage() {
  const data = await fetchArticles({ type: 'travel_guide', limit: 24 });
  const guides = data.items;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <MapPin className="h-3.5 w-3.5" /> Curated Field Notes
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Destination Guides
        </h1>
        <p className="font-serif text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Comprehensive, field-tested guides covering route planning, cultural etiquette, transit
          logistics, and local insights.
        </p>
      </header>

      {/* Grid of Destination Guides */}
      {guides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide, idx) => (
            <ArticleCard key={guide.id} article={guide} variant="standard" priority={idx === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-3">
          <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
          <h2 className="font-serif text-xl font-bold text-foreground">
            No Destination Guides Published Yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Destination guides published under the Travel Guide content type will appear in this
            dedicated hub.
          </p>
        </div>
      )}
    </div>
  );
}
