import type { MetadataRoute } from 'next';

import { siteConfig } from '@/config/site';
import { fetchCategories, fetchSitemap, fetchTags } from '@/lib/api';

export const revalidate = 300;

/**
 * Only indexable, content-bearing URLs: listing pages, published articles and
 * topics that have stories. `search`, previews and paginated pages are left out
 * on purpose. `lastModified` is the newest real change, never "now", because
 * crawlers learn to ignore a date that always changes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const [articles, categories, tags] = await Promise.all([
    fetchSitemap(),
    fetchCategories(),
    fetchTags(),
  ]);

  const latest = articles.reduce<Date | undefined>((newest, article) => {
    const changed = new Date(article.updatedAt || article.publishedAt);
    return !newest || changed > newest ? changed : newest;
  }, undefined);

  const listing = (path: string, changeFrequency: 'daily' | 'weekly', priority: number) => ({
    url: `${baseUrl}${path}`,
    lastModified: latest,
    changeFrequency,
    priority,
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    listing('', 'daily', 1),
    listing('/articles', 'daily', 0.9),
    listing('/destinations', 'weekly', 0.8),
    listing('/categories', 'weekly', 0.7),
    listing('/tags', 'weekly', 0.6),
    // About and Contact change rarely and have no timestamp we can trust.
    { url: `${baseUrl}/about`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${baseUrl}/contact`, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  // A topic page with no stories is thin content; leave it out until it has some.
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((category) => category.postCount > 0)
    .map((category) => ({
      url: `${baseUrl}/categories/${category.slug}`,
      lastModified: latest,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const tagRoutes: MetadataRoute.Sitemap = tags
    .filter((tag) => tag.postCount > 0)
    .map((tag) => ({
      url: `${baseUrl}/tags/${tag.slug}`,
      lastModified: latest,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  return [...staticRoutes, ...articleRoutes, ...categoryRoutes, ...tagRoutes];
}
