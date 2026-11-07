import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Newspaper } from 'lucide-react';

import {
  BROWSE_PATH,
  BrowseSearchForm,
  BrowseSortTabs,
  BrowseTopicChips,
  browseHref,
  FEED_PAGE_SIZE,
  isFiltered,
  nextToken,
  PaginationLinks,
  parseBrowseParams,
} from '@multi-site-cms/ui';

import { DispatchFeed } from '@/components/browse/DispatchFeed';
import { siteConfig, defaultOgImage } from '@/config/site';
import { fetchArticles, fetchCategories } from '@/lib/api';

export const revalidate = 30;

interface ArticlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const state = parseBrowseParams(await searchParams);
  const canonical = browseHref(state, { page: state.page });

  return {
    title: state.q
      ? `Search: ${state.q}`
      : state.page > 1
        ? `All Dispatches: Page ${state.page}`
        : 'All Dispatches',
    description: `Every published news story, race report, and live dispatch from ${siteConfig.name}.`,
    alternates: { canonical },
    // Search results are thin, endless variations of the same list: keep them out of the index.
    robots:
      state.q || state.tag || state.sort !== 'newest' ? { index: false, follow: true } : undefined,
    openGraph: {
      images: [defaultOgImage],
      title: `All Dispatches | ${siteConfig.name}`,
      url: canonical,
    },
  };
}

/** The one page for finding dispatches: search, discipline, sort and the list. */
export default async function ArticlesIndexPage({ searchParams }: ArticlesPageProps) {
  const state = parseBrowseParams(await searchParams);

  const [result, categories] = await Promise.all([
    fetchArticles({
      page: state.page,
      limit: FEED_PAGE_SIZE,
      search: state.q || undefined,
      categorySlug: state.category || undefined,
      tagSlug: state.tag || undefined,
      sort: state.sort,
    }),
    fetchCategories(),
  ]);

  // A stale or crafted page past the end goes back to the first page.
  if (state.page > 1 && result.items.length === 0) {
    redirect(browseHref(state, { page: 1 }));
  }

  const discipline = categories.find((category) => category.slug === state.category);
  const filtered = isFiltered(state);

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Dispatches</span>
        </nav>

        <header className="mb-8 border-b border-border pb-8">
          <div className="mb-2 flex items-center gap-2">
            <Newspaper className="size-4 text-primary" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              {state.q ? 'Search' : discipline ? 'Discipline' : 'Archive'}
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
            {state.q ? `Results for “${state.q}”` : (discipline?.name ?? 'All Dispatches')}
          </h1>
          <BrowseSearchForm
            state={state}
            placeholder="Search dispatches, events and disciplines…"
            className="mt-5"
          />
        </header>

        <div className="space-y-5">
          <BrowseTopicChips
            topics={categories}
            state={state}
            linkComponent={Link}
            label="Filter by discipline"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrowseSortTabs state={state} linkComponent={Link} />
            <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
              {result.total === 0
                ? 'No dispatches found'
                : `${result.total} dispatch${result.total === 1 ? '' : 'es'}`}
              {filtered && (
                <>
                  {' · '}
                  <Link href={BROWSE_PATH} className="font-semibold text-primary hover:underline">
                    Clear all
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Remounts when the filters change, so a cursor never leaks between lists. */}
          <DispatchFeed
            key={browseHref(state)}
            initialItems={result.items}
            initialNext={nextToken(result, state.sort)}
            total={result.total}
            query={state}
          />

          <noscript>
            <PaginationLinks
              page={state.page}
              totalPages={Math.max(1, result.totalPages)}
              hrefFor={(target) => browseHref(state, { page: target })}
              linkComponent={Link}
              label="Dispatch pages"
              className="border-t border-border pt-6"
            />
          </noscript>
        </div>
      </div>
    </div>
  );
}
