import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  browseHref,
  FEED_PAGE_SIZE,
  isFiltered,
  JsonLd,
  nextToken,
  parseBrowseParams,
} from '@multi-site-cms/ui';

import { PortalContentContainer } from '@/components/portal/PortalContentContainer';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 60; // ISR revalidation every 60s

const LATEST_COUNT = 3;

interface ArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const state = parseBrowseParams(await searchParams);
  const description =
    'Discover breathtaking destinations, get expert travel tips, and read inspiring travel stories from around the globe.';

  return {
    title: state.q ? `Search: ${state.q}` : `Travel Blog & Explorer Portal — ${siteConfig.name}`,
    description,
    alternates: { canonical: browseHref(state, { page: state.page }) },
    // Search results are thin, endless variations of the same list: keep them out of the index.
    robots:
      state.q || state.tag || state.sort !== 'newest' ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlesPortalPage({ searchParams }: ArticlesPageProps) {
  const state = parseBrowseParams(await searchParams);

  const [articlesData, categories, overall] = await Promise.all([
    fetchArticles({
      page: state.page,
      limit: FEED_PAGE_SIZE,
      search: state.q || undefined,
      categorySlug: state.category || undefined,
      tagSlug: state.tag || undefined,
      sort: state.sort,
    }),
    fetchCategories(),
    // The newest stories overall, for the sidebar's latest reads even while filtering.
    fetchArticles({ limit: LATEST_COUNT }),
  ]);

  // A stale or crafted page past the end goes back to the first page.
  if (state.page > 1 && articlesData.items.length === 0) {
    redirect(browseHref(state, { page: 1 }));
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
      {!isFiltered(state) && <JsonLd data={jsonLd} />}
      <PortalContentContainer
        state={state}
        articles={articlesData.items}
        next={nextToken(articlesData, state.sort)}
        categories={categories}
        totalPages={Math.max(1, articlesData.totalPages)}
        total={articlesData.total}
        latest={overall.items}
      />
    </>
  );
}
