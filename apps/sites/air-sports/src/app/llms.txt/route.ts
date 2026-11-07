import { buildLlmsTxt } from '@multi-site-cms/ui';

import { siteConfig } from '@/config/site';
import { fetchArticles } from '@/lib/api';

export const revalidate = 300;

const LATEST_ARTICLES = 20;

/** `/llms.txt`: a Markdown map of the site for language models, from published data only. */
export async function GET(): Promise<Response> {
  const { items } = await fetchArticles({ limit: LATEST_ARTICLES });

  const body = buildLlmsTxt({
    name: siteConfig.name,
    description: siteConfig.description,
    sections: [
      {
        title: 'Dispatches',
        url: `${siteConfig.url}/articles`,
        summary: 'Every published dispatch',
      },
      { title: 'Events', url: `${siteConfig.url}/events`, summary: 'Live and upcoming coverage' },
      { title: 'About', url: `${siteConfig.url}/about`, summary: 'Who we are and what we cover' },
      {
        title: 'Disciplines',
        url: `${siteConfig.url}/categories`,
        summary: 'Dispatches by discipline',
      },
    ],
    articles: items.map((article) => ({
      title: article.title,
      url: `${siteConfig.url}/articles/${article.slug}`,
      summary: article.excerpt,
    })),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
