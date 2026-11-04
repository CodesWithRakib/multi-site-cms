import React from 'react';
import type { Metadata } from 'next';

import { AirSportsHero } from '@/components/home/AirSportsHero';
import { AirSportsNewsletter } from '@/components/home/AirSportsNewsletter';
import { FlyHigherBanner } from '@/components/home/FlyHigherBanner';
import { LiveDispatchesSection } from '@/components/home/LiveDispatchesSection';
import { PopularAirSports } from '@/components/home/PopularAirSports';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories, fetchEvents } from '@/lib/api';

export const revalidate = 30; // ISR 30s

export const metadata: Metadata = {
  title: `${siteConfig.name} — Adventure in the Sky`,
  description: siteConfig.description,
};

export default async function AirSportsHomePage() {
  const [allArticlesRes, events, categories] = await Promise.all([
    fetchArticles({ limit: 8 }),
    fetchEvents(),
    fetchCategories(),
  ]);

  const articles = allArticlesRes.items;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="relative space-y-16 pb-12 sm:space-y-24">
        {/* Sky Hero & Feature Badges */}
        <AirSportsHero />

        {/* Most-covered disciplines, from CMS categories */}
        <PopularAirSports categories={categories} />

        {/* "Fly Higher, Live Better" Value Banner */}
        <FlyHigherBanner />

        {/* Live Flight Telemetry & Race Dispatches */}
        <LiveDispatchesSection articles={articles} events={events} />

        {/* Flight Inspiration Newsletter Banner */}
        <AirSportsNewsletter />
      </div>
    </>
  );
}
