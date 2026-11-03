import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { AirSportsSearchContainer } from '@/components/search/AirSportsSearchContainer';
import { fetchArticles, fetchCategories, fetchTags } from '@/lib/api';
import type { PublicPostSort } from '@multi-site-cms/types';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Search Radar Dispatches',
  description: 'Search breaking air sports news, pilot telemetry, and competitive reports.',
  alternates: {
    canonical: '/search',
  },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || '';
  const category = params.category?.trim() || '';
  const tag = params.tag?.trim() || '';
  const sort = (params.sort?.trim() || 'newest') as PublicPostSort;

  const [searchRes, categories, tags] = await Promise.all([
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

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Radar
          </Link>
          <span>/</span>
          <span className="text-foreground">Search Dispatches</span>
        </nav>

        {/* Radar Header */}
        <div className="border-b border-border pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <SearchIcon className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Telemetry Query Hub
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Search Radar
          </h1>
          <p className="font-mono text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Live telemetry search across pilot profiles, competitive flight logs, wingsuit
            transmissions, and air sports dispatches.
          </p>
        </div>

        {/* Interactive Search & Faceted Filter Container */}
        <AirSportsSearchContainer
          initialArticles={searchRes.items}
          initialTotal={searchRes.total}
          categories={categories}
          tags={tags}
          initialQuery={query}
          initialCategory={category}
          initialTag={tag}
          initialSort={sort}
        />
      </div>
    </div>
  );
}
