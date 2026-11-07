import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { pageHref, parsePageParam, JsonLd } from '@multi-site-cms/ui';

import { PortalContentContainer } from '@/components/portal/PortalContentContainer';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60; // ISR cache revalidation every 60s

/** Stories per page; further pages are `?page=N`, and `?category=slug` filters on the server. */
const PAGE_SIZE = 12;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string | string[]; category?: string | string[] }>;
}

/** A valid category slug from the URL, or '' (untrusted input never reaches the API as-is). */
function parseCategory(value: string | string[] | undefined): string {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase() ?? '';
  return SLUG.test(raw) ? raw : '';
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const category = parseCategory(params.category);
  const base = category ? `/articles?category=${category}` : '/articles';

  return {
    title: `Travel Blog & Explorer Portal — ${siteConfig.name}`,
    description:
      'Discover breathtaking destinations, get expert travel tips, and read inspiring travel stories from around the globe.',
    alternates: { canonical: pageHref(base, page) },
  };
}

export default async function ArticlesPortalPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const category = parseCategory(params.category);

  const [articlesData, categories] = await Promise.all([
    fetchArticles({ page, limit: PAGE_SIZE, categorySlug: category || undefined }),
    fetchCategories(),
  ]);

  // A stale or crafted page past the end goes back to the first page.
  if (page > 1 && articlesData.items.length === 0) {
    redirect(category ? `/articles?category=${category}` : '/articles');
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Travel Blog & Explorer Portal',
    description: 'Explore the world one story at a time.',
    url: `${siteConfig.url}/articles`,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PortalContentContainer
        articles={articlesData.items}
        categories={categories}
        activeCategorySlug={category || null}
        page={page}
        totalPages={Math.max(1, articlesData.totalPages)}
        total={articlesData.total}
      />
    </>
  );
}
