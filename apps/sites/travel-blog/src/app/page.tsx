import type { Metadata } from 'next';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { KeepReading } from '@/components/home/KeepReading';
import { LatestStories } from '@/components/home/LatestStories';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { TopicShowcase } from '@/components/home/TopicShowcase';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';
import { buildHomeFeed } from '@/lib/home-feed';

export const revalidate = 60; // ISR revalidation every 60 seconds

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

/** Enough stories for every slot: hero slides, latest grid, keep-reading. */
const HOME_ARTICLE_LIMIT = 20;

export default async function TravelHomePage() {
  const [articlesData, categories] = await Promise.all([
    fetchArticles({ limit: HOME_ARTICLE_LIMIT }),
    fetchCategories(),
  ]);

  const feed = buildHomeFeed(articlesData.items, categories);

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

      <HeroCarousel slides={feed.slides} />

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:space-y-16 sm:px-6 sm:py-14 lg:px-8">
        <LatestStories articles={feed.latest} />
        <TopicShowcase topics={feed.topics} />
        <KeepReading articles={feed.more} />
        <NewsletterBanner />
      </div>
    </>
  );
}
