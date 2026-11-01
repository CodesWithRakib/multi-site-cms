import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radio, Search as SearchIcon } from 'lucide-react';

import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { fetchArticles, fetchCategories } from '@/lib/api';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: 'Search Radar Dispatches',
  description: 'Search breaking air sports news, pilot reports, and telemetry dispatches.',
  alternates: {
    canonical: '/search',
  },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const [searchRes, categories] = await Promise.all([
    query
      ? fetchArticles({ search: query, limit: 24 })
      : Promise.resolve({ items: [], total: 0, page: 1, limit: 24, totalPages: 1 }),
    fetchCategories(),
  ]);

  const articles = searchRes.items;

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Radar
          </Link>
          <span>/</span>
          <span className="text-foreground">Search</span>
        </nav>

        {/* Header & Search Form */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-2">
            <SearchIcon className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Archive Query
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Search Radar
          </h1>

          <form method="GET" action="/search" className="mt-6 max-w-2xl flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search by keywords, pilots, events, locations..."
                aria-label="Search query"
                required
                className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-primary px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
            >
              Search
            </button>
          </form>

          {query && (
            <p className="mt-4 text-xs font-mono text-muted-foreground">
              Found {searchRes.total} result{searchRes.total === 1 ? '' : 's'} for &ldquo;{query}
              &rdquo;
            </p>
          )}
        </div>

        {/* Search Results */}
        {!query ? (
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Explore by Discipline
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="rounded-xl border border-border bg-card px-4 py-2 font-mono text-xs text-foreground hover:border-primary hover:text-primary transition-colors shadow-xs"
                >
                  #{c.name} ({c.postCount})
                </Link>
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
            <Radio className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h2 className="text-base font-bold text-foreground">No Transmissions Found</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              No published dispatches matched &ldquo;{query}&rdquo;. Try broader keywords or browse
              categories.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <AirSportsCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
