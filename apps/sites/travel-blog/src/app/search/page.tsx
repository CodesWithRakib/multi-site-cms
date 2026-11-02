import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Search as SearchIcon, Sparkles } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search Articles & Guides',
  description: `Search published articles, destination guides, and field dispatches on ${siteConfig.name}.`,
  robots: {
    index: false,
    follow: true,
  },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || '';

  const [articlesData, categories] = await Promise.all([
    query ? fetchArticles({ search: query, limit: 24 }) : Promise.resolve({ items: [], total: 0 }),
    fetchCategories(),
  ]);

  const results = articlesData.items;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      <header className="border-b border-border/60 pb-8 space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> Archive Exploration
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Search Dispatches & Guides
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Search our archive of travel stories, practical field notes, and route recommendations.
        </p>

        {/* Search Input Form */}
        <form method="GET" action="/search" className="mt-6 flex max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search destinations, Paris, Tokyo, hiking, street food..."
              required
              aria-label="Search keywords"
              className="w-full rounded-full border border-border bg-card pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-600/20"
          >
            Search
          </button>
        </form>

        {/* Quick Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="text-muted-foreground font-medium">Popular:</span>
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/search?q=${encodeURIComponent(cat.name)}`}
              className="rounded-full border border-border/80 bg-card px-3 py-1 font-semibold text-foreground/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </header>

      {/* Results Section */}
      {query ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-3">
            <span>
              Found <strong>{articlesData.total}</strong>{' '}
              {articlesData.total === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-4">
              <Compass className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="font-serif text-xl font-bold text-foreground">
                No Dispatches Match &ldquo;{query}&rdquo;
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try searching for broader keywords like a country name, travel style, or explore one
                of our categories.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
