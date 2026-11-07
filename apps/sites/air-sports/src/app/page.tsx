import type { Metadata } from 'next';
import { JsonLd } from '@multi-site-cms/ui';

import { AirSportsNewsletter } from '@/components/home/AirSportsNewsletter';
import { FlightDeckHero } from '@/components/home/FlightDeckHero';
import { LatestDispatches } from '@/components/home/LatestDispatches';
import { TopDispatches } from '@/components/home/TopDispatches';
import { siteConfig, feedAlternates } from '@/config/site';
import { fetchArticles, fetchCategories, fetchEvents } from '@/lib/api';
import { upcomingEvents } from '@/lib/format';

export const revalidate = 30; // ISR 30s

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: '/', types: feedAlternates },
  openGraph: { url: '/' },
};

/** Hero (1) + top card (1) + wire (6) + grid (8). */
const HOME_ARTICLE_LIMIT = 16;
const TOP_BLOCK_SIZE = 7;
const HERO_EVENT_COUNT = 3;

export default async function AirSportsHomePage() {
  const [articlesRes, events, categories] = await Promise.all([
    fetchArticles({ limit: HOME_ARTICLE_LIMIT }),
    fetchEvents(),
    fetchCategories(),
  ]);

  const articles = articlesRes.items;
  // The hero is built around an image, so prefer the newest dispatch with one.
  const lead = articles.find((article) => article.featuredImage) ?? articles[0];
  const rest = articles.filter((article) => article !== lead);
  const disciplines = categories
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />

      <FlightDeckHero
        lead={lead}
        events={upcomingEvents(events, HERO_EVENT_COUNT)}
        disciplines={disciplines}
      />

      <div className="space-y-12 py-10 sm:space-y-14 sm:py-12">
        <TopDispatches articles={rest.slice(0, TOP_BLOCK_SIZE)} />
        <LatestDispatches articles={rest.slice(TOP_BLOCK_SIZE)} />
        <AirSportsNewsletter />
      </div>
    </>
  );
}
