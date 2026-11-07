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
        title: 'Stories',
        url: `${siteConfig.url}/articles`,
        summary: 'Every published travel story',
      },
      {
        title: 'Destination guides',
        url: `${siteConfig.url}/destinations`,
        summary: 'Field-tested route guides',
      },
      { title: 'Topics', url: `${siteConfig.url}/categories`, summary: 'Stories grouped by topic' },
      { title: 'About', url: `${siteConfig.url}/about` },
      { title: 'Contact', url: `${siteConfig.url}/contact` },
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
