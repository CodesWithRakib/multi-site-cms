import type { Metadata } from 'next';
import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
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
      <PageHeader
        eyebrow={
          <>
            <MapPin aria-hidden="true" className="size-3.5" /> Field notes &amp; routes
          </>
        }
        title="Destination guides"
        description="Field-tested guides covering route planning, cultural etiquette, transit and local insight for your next trip."
        meta={`${guides.length} ${guides.length === 1 ? 'guide' : 'guides'}`}
        scene="coast"
      />

      {/* Interactive Destination Explorer Container */}
      <DestinationsClientContainer initialGuides={guides} categories={categories} />
    </div>
  );
}
