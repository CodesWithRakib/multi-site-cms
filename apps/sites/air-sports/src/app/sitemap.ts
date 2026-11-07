import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';
import { fetchCategories, fetchEvents, fetchSitemapEntries, fetchTags } from '@/lib/api';

export const revalidate = 300;

/**
 * Only indexable, content-bearing URLs. Search results are `noindex`, so listing them
 * contradicted itself; previews and paginated pages are left out on purpose.
 * `lastModified` is the newest real change, never "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, categories, tags, events] = await Promise.all([
    fetchSitemapEntries(),
    fetchCategories(),
    fetchTags(),
    fetchEvents(),
  ]);

  const latest = entries.reduce<Date | undefined>((newest, entry) => {
    const changed = new Date(entry.updatedAt || entry.publishedAt);
    return !newest || changed > newest ? changed : newest;
  }, undefined);

  const articleRoutes: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${siteConfig.url}/articles/${entry.slug}`,
    lastModified: new Date(entry.updatedAt || entry.publishedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, lastModified: latest, changeFrequency: 'hourly', priority: 1 },
    {
      url: `${siteConfig.url}/articles`,
      lastModified: latest,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/events`,
      lastModified: latest,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // No trustworthy timestamp for the About page, so no lastModified.
    { url: `${siteConfig.url}/about`, changeFrequency: 'monthly', priority: 0.4 },
    {
      url: `${siteConfig.url}/categories`,
      lastModified: latest,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteConfig.url}/tags`,
      lastModified: latest,
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${siteConfig.url}/events/${event.slug}`,
    lastModified: latest,
    changeFrequency: event.status === 'live' ? 'hourly' : 'daily',
    priority: event.status === 'live' ? 0.9 : 0.6,
  }));

  // A topic page with no stories is thin content; leave it out until it has some.
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => category.postCount > 0)
    .map((category) => ({
      url: `${siteConfig.url}/categories/${category.slug}`,
      lastModified: latest,
      changeFrequency: 'daily',
      priority: 0.7,
    }));

  const tagRoutes: MetadataRoute.Sitemap = tags
    .filter((tag) => tag.postCount > 0)
    .map((tag) => ({
      url: `${siteConfig.url}/tags/${tag.slug}`,
      lastModified: latest,
      changeFrequency: 'daily',
      priority: 0.5,
    }));

  return [...staticRoutes, ...articleRoutes, ...eventRoutes, ...categoryRoutes, ...tagRoutes];
}
