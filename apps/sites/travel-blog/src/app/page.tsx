import type { Metadata } from 'next';
import { DestinationSearchBar } from '@/components/home/DestinationSearchBar';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { PopularDestinations } from '@/components/home/PopularDestinations';
import { TravelGuidesSection } from '@/components/home/TravelGuidesSection';
import { TravelHero } from '@/components/home/TravelHero';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60; // ISR revalidation every 60 seconds

export const metadata: Metadata = {
  title: `${siteConfig.name} — Explore the World`,
  description: siteConfig.description,
};

export default async function TravelHomePage() {
  const [articlesData, categories] = await Promise.all([
    fetchArticles({ limit: 8 }),
    fetchCategories(),
  ]);

  const articles = articlesData.items;

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        description: siteConfig.description,
      },
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        {/* Editorial Hero */}
        <TravelHero />

        {/* Floating Destination Search Filter */}
        <div className="mb-16 sm:mb-24">
          <DestinationSearchBar categories={categories} />
        </div>

        <div className="space-y-16 sm:space-y-24">
          {/* Popular Destinations Showcase */}
          <PopularDestinations />

          {/* Dynamic Travel Guides Grid from Live Backend */}
          <TravelGuidesSection articles={articles} />

          {/* Illustrated Mint Newsletter Banner */}
          <NewsletterBanner />
        </div>
      </div>
    </>
  );
}
