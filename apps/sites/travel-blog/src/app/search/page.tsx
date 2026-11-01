import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, Search as SearchIcon } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Search Articles',
  description: `Search published articles, destination guides, and field dispatches on ${siteConfig.name}.`,
  robots: {
    index: false, // Prevent query-string search pages from polluting search engine index
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <header className="border-b border-border/60 pb-8 space-y-3">
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Search Dispatches
        </h1>
        <p className="font-serif text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Search our archive of travel features, practical field notes, and route recommendations.
        </p>

        {/* Search Input Form */}
        <form method="GET" action="/search" className="mt-6 flex max-w-xl items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search destinations, fjords, Kyoto, hiking..."
              required
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Search
          </button>
        </form>
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
                No Dispatches Match Your Search
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try searching for broader keywords like a country name, travel style, or explore one
                of our popular categories below.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {categories.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl bg-muted/30 border border-border p-8 text-center space-y-4">
          <h3 className="font-serif text-lg font-bold text-foreground">
            Popular Topics to Explore
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {c.name} ({c.postCount})
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
