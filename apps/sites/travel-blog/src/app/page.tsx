import type { Metadata } from 'next';
import { collectAuthors, JsonLd } from '@multi-site-cms/ui';
import { hasSiteAboutContent } from '@multi-site-cms/validation/site-about';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import { GuidesRail } from '@/components/home/GuidesRail';
import { LatestStories } from '@/components/home/LatestStories';
import { MoreStories } from '@/components/home/MoreStories';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { PhotoMosaic } from '@/components/home/PhotoMosaic';
import { SpotlightStory } from '@/components/home/SpotlightStory';
import { TopicShowcase } from '@/components/home/TopicShowcase';
import { TrustAndWriters } from '@/components/home/TrustAndWriters';
import { siteConfig, feedAlternates } from '@/config/site';
import { fetchArticles, fetchCategories, fetchSiteConfig } from '@/lib/api';
import { buildHomeFeed } from '@/lib/home-feed';

export const revalidate = 60; // ISR revalidation every 60 seconds

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: '/', types: feedAlternates },
  openGraph: { url: '/' },
};

/** The most the public API serves in one page: enough for every section below. */
const HOME_ARTICLE_LIMIT = 50;

export default async function TravelHomePage() {
  const [articlesData, categories, config] = await Promise.all([
    fetchArticles({ limit: HOME_ARTICLE_LIMIT }),
    fetchCategories(),
    fetchSiteConfig(),
  ]);

  const feed = buildHomeFeed(articlesData.items, categories);
  const writers = collectAuthors(articlesData.items);
  const pillars = hasSiteAboutContent(config?.about) ? config.about.pillars : [];

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
      <JsonLd data={jsonLd} />

      <HeroCarousel slides={feed.slides} />

      <div className="mx-auto max-w-7xl space-y-14 px-4 pb-12 pt-6 sm:space-y-20 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        <LatestStories articles={feed.latest} />
        <TopicShowcase topics={feed.topics} />
        <SpotlightStory article={feed.spotlight} />
        <GuidesRail guides={feed.guides} />
        <PhotoMosaic stories={feed.photos} />
        <MoreStories articles={feed.more} total={articlesData.total} />
        <TrustAndWriters pillars={pillars} writers={writers} />
        <NewsletterBanner />
      </div>
    </>
  );
}
