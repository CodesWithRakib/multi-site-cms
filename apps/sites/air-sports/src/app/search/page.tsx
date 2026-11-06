import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Compass, Search, SearchX } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import { MobileFilterSheet } from '@/components/search/MobileFilterSheet';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchPagination } from '@/components/search/SearchPagination';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchCategories, fetchTags } from '@/lib/api';
import { parseSearchParams, SEARCH_SORTS, searchHref } from '@/lib/search-params';

export const metadata: Metadata = {
  title: 'Search dispatches',
  description: `Search published dispatches and guides on ${siteConfig.name}.`,
  robots: { index: false, follow: true },
};

const PAGE_SIZE = 12;

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const state = parseSearchParams(await searchParams);

  const [results, everything, categories, tags] = await Promise.all([
    fetchArticles({
      search: state.q || undefined,
      categorySlug: state.category || undefined,
      tagSlug: state.tag || undefined,
      sort: state.sort,
      page: state.page,
      limit: PAGE_SIZE,
    }),
    // Unfiltered: the "All" count, the hero stats and the hero photo.
    fetchArticles({ limit: 1 }),
    fetchCategories(),
    fetchTags(),
  ]);

  const topicCount = categories.filter((category) => category.postCount > 0).length;
  const heroImage = everything.items[0]?.featuredImage;
  const activeFilters = [state.category, state.tag].filter(Boolean).length;
  const filters = (
    <SearchFilters
      state={state}
      categories={categories}
      tags={tags}
      totalStories={everything.total}
    />
  );

  return (
    <>
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        {heroImage && (
          <Image
            src={heroImage.url}
            alt=""
            fill
            preload
            sizes="100vw"
            className="-z-20 object-cover opacity-50"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-neutral-950 via-neutral-950/80 to-neutral-950/30"
        />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-xs text-white/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{' '}
            / <span className="text-white">Search</span>
          </nav>
          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
                Search <span className="text-brand-300">dispatches</span>
              </h1>
              <p className="mt-3 text-base text-white/80 sm:text-lg">
                Every report, guide and race update we have published, in one place.
              </p>
              <form action="/search" role="search" className="relative mt-6 max-w-xl">
                {state.category && <input type="hidden" name="category" value={state.category} />}
                {state.tag && <input type="hidden" name="tag" value={state.tag} />}
                <label htmlFor="search-q" className="sr-only">
                  Search stories
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-5 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="search-q"
                  name="q"
                  type="search"
                  defaultValue={state.q}
                  placeholder="Try “Shakrain”, “drone rules” or “monsoon”"
                  className="h-14 w-full rounded-full border-0 bg-white pl-13 pr-16 text-base text-neutral-900 shadow-xl placeholder:text-neutral-500 focus:outline-none focus:ring-4 focus:ring-brand-400/40"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 ease-out active:scale-95"
                >
                  <Search aria-hidden="true" className="size-4" />
                </button>
              </form>
            </div>
            <dl className="flex gap-3">
              {[
                { icon: BookOpen, value: everything.total, label: 'Dispatches' },
                { icon: Compass, value: topicCount, label: 'Topics' },
              ].map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md"
                >
                  <Icon aria-hidden="true" className="size-5 text-brand-300" />
                  <div>
                    <dd className="text-xl font-bold tabular-nums">{value}</dd>
                    <dt className="text-xs text-white/70">{label}</dt>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-6 max-w-7xl rounded-t-[2rem] bg-background px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-border bg-card p-5 shadow-xs">
              {filters}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav
                aria-label="Sort results"
                className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1"
              >
                {SEARCH_SORTS.map((sort) => (
                  <Link
                    key={sort.value}
                    href={searchHref(state, { sort: sort.value })}
                    aria-current={state.sort === sort.value ? 'true' : undefined}
                    className={cn(
                      'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
                      state.sort === sort.value
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {sort.label}
                  </Link>
                ))}
              </nav>
              <MobileFilterSheet activeCount={activeFilters}>{filters}</MobileFilterSheet>
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              {results.total === 0
                ? 'No dispatches found'
                : `${results.total} ${results.total === 1 ? 'dispatch' : 'dispatches'}`}
              {state.q && (
                <>
                  {' '}
                  for <span className="font-semibold text-foreground">“{state.q}”</span>
                </>
              )}
              {(state.q || activeFilters > 0) && (
                <>
                  {' · '}
                  <Link href="/search" className="font-semibold text-primary hover:underline">
                    Clear all
                  </Link>
                </>
              )}
            </p>

            {results.items.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
                <SearchX aria-hidden="true" className="size-10 text-muted-foreground" />
                <p className="font-semibold text-foreground">Nothing matches yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try a shorter word, another category, or clear the filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.items.map((article) => (
                  <SearchResultCard key={article.id} article={article} query={state.q} />
                ))}
              </div>
            )}

            <SearchPagination state={state} totalPages={results.totalPages} />
          </div>
        </div>
      </div>
    </>
  );
}
