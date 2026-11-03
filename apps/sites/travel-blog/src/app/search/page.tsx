import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { SearchClientContainer } from '@/components/search/SearchClientContainer';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories, fetchTags } from '@/lib/api';
import type { PublicPostSort } from '@multi-site-cms/types';

export const revalidate = 60; // ISR cache revalidation

export const metadata: Metadata = {
  title: 'Search Dispatches & Destination Guides',
  description: `Search published articles, destination itineraries, and field notes on ${siteConfig.name}.`,
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
    budget?: string;
    time?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || '';
  const category = params.category?.trim() || '';
  const tag = params.tag?.trim() || '';
  const sort = (params.sort?.trim() || 'newest') as PublicPostSort;

  const [articlesData, categories, tags] = await Promise.all([
    fetchArticles({
      search: query || undefined,
      categorySlug: category || undefined,
      tagSlug: tag || undefined,
      sort,
      limit: 24,
    }),
    fetchCategories(),
    fetchTags(),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: 'Search Dispatches & Destination Guides',
    description: `Search results on ${siteConfig.name}`,
    url: `${siteConfig.url}/search`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
        {/* Page Header */}
        <header className="border-b border-border/60 pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Archive Discovery</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Search Dispatches & Guides
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
            Discover destinations, travel field notes, packing recommendations, and curated routes
            across our global publication archive.
          </p>
        </header>

        {/* Interactive Search & Faceted Filter Hub */}
        <SearchClientContainer
          initialArticles={articlesData.items}
          initialTotal={articlesData.total}
          categories={categories}
          tags={tags}
          initialQuery={query}
          initialCategory={category}
          initialTag={tag}
          initialSort={sort}
        />
      </div>
    </>
  );
}
