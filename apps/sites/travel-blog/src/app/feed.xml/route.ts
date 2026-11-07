import { buildRssFeed } from '@multi-site-cms/ui';

import { siteConfig } from '@/config/site';
import { fetchArticles } from '@/lib/api';

export const revalidate = 300;

const FEED_ITEMS = 20;

/** `/feed.xml`: RSS 2.0 of the newest published stories; published data only. */
export async function GET(): Promise<Response> {
  const { items } = await fetchArticles({ limit: FEED_ITEMS });

  const body = buildRssFeed({
    title: siteConfig.name,
    link: siteConfig.url,
    feedUrl: `${siteConfig.url}/feed.xml`,
    description: siteConfig.description,
    items: items.map((article) => ({
      title: article.title,
      link: `${siteConfig.url}/articles/${article.slug}`,
      publishedAt: article.publishedAt,
      description: article.excerpt,
      categories: article.categories.map((category) => category.name),
    })),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
