import type { Metadata } from 'next';
import { JsonLd } from '@multi-site-cms/ui';

import { AirSportsNewsletter } from '@/components/home/AirSportsNewsletter';
import { DisciplineRail } from '@/components/home/DisciplineRail';
import { FlightDeckHero } from '@/components/home/FlightDeckHero';
import { LatestDispatches } from '@/components/home/LatestDispatches';
import { ScheduleBoard } from '@/components/home/ScheduleBoard';
import { TelemetryBar } from '@/components/home/TelemetryBar';
import { TopDispatches } from '@/components/home/TopDispatches';
import { siteConfig, feedAlternates } from '@/config/site';
import { fetchArticles, fetchCategories, fetchEvents } from '@/lib/api';
import { upcomingEvents } from '@/lib/format';
import { buildHomeFeed } from '@/lib/home-feed';

export const revalidate = 30; // ISR 30s

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: '/', types: feedAlternates },
  openGraph: { url: '/' },
};

/** The most the public API serves in one page: enough for every section below. */
const HOME_ARTICLE_LIMIT = 50;
const HERO_EVENT_COUNT = 3;

export default async function AirSportsHomePage() {
  const [articlesRes, events, categories] = await Promise.all([
    fetchArticles({ limit: HOME_ARTICLE_LIMIT }),
    fetchEvents(),
    fetchCategories(),
  ]);

  const feed = buildHomeFeed({
    articles: articlesRes.items,
    totalDispatches: articlesRes.total,
    categories,
    events,
  });

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
        lead={feed.lead}
        events={upcomingEvents(events, HERO_EVENT_COUNT)}
        disciplines={feed.disciplines.map((discipline) => discipline.category)}
      />

      <div className="space-y-12 py-10 sm:space-y-16 sm:py-14">
        <TelemetryBar stats={feed.stats} />
        <ScheduleBoard events={feed.schedule} />
        <TopDispatches articles={feed.top} />
        <DisciplineRail disciplines={feed.disciplines} />
        <LatestDispatches articles={feed.more} total={feed.stats.dispatches} />
        <AirSportsNewsletter />
      </div>
    </>
  );
}
