import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { PaginationLinks } from '@multi-site-cms/ui';

import { PageHeader } from '@/components/ui/PageHeader';
import type { PublicArticle, PublicCategory } from '@/lib/api';
import { BROWSE_PATH, browseHref, isFiltered, type BrowseState } from '@/lib/browse-params';
import type { FeedNext } from '@/lib/feed-request';

import { ArticleFeed } from './ArticleFeed';
import { BrowseSearchForm } from './BrowseSearchForm';
import { BrowseSortTabs } from './BrowseSortTabs';
import { PortalCategoryChips } from './PortalCategoryChips';
import { PortalRightSidebar } from './PortalRightSidebar';

interface PortalContentContainerProps {
  readonly state: BrowseState;
  /** First batch for the current filters, loaded by the page; the feed loads the rest. */
  readonly articles: PublicArticle[];
  readonly next: FeedNext | null;
  readonly categories: PublicCategory[];
  readonly totalPages: number;
  /** Stories matching the current filters across all batches. */
  readonly total: number;
  /** Newest stories overall, for the sidebar. */
  readonly latest: PublicArticle[];
}

/**
 * The one page for finding stories: search, topic, sort and the story list. The
 * URL carries all of it; the first batch is rendered on the server and the feed
 * continues as the reader scrolls. The numbered links inside `<noscript>` keep
 * every story reachable without JavaScript.
 */
export function PortalContentContainer({
  state,
  articles,
  next,
  categories,
  totalPages,
  total,
  latest,
}: PortalContentContainerProps) {
  const activeCategory = categories.find((c) => c.slug === state.category);
  const filtered = isFiltered(state);

  const title = state.q ? (
    <>
      Results for <span className="text-primary">“{state.q}”</span>
    </>
  ) : activeCategory ? (
    activeCategory.name
  ) : (
    <>
      Travel stories &amp;{' '}
      <span className="font-handwriting text-4xl font-bold text-primary sm:text-6xl">guides</span>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <PageHeader
        eyebrow={
          <>
            <BookOpen aria-hidden="true" className="size-3.5" /> The Explorer Journal
          </>
        }
        title={title}
        description={
          state.q
            ? 'Stories and guides that match your search.'
            : activeCategory?.description ||
              'Firsthand itineraries, practical field notes and the people and places behind them.'
        }
        scene="mountains"
      >
        <BrowseSearchForm state={state} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12" id="blogs-grid">
        <div className="space-y-5 lg:col-span-8">
          <PortalCategoryChips categories={categories} state={state} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrowseSortTabs state={state} />
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {total === 0 ? 'No stories found' : `${total} ${total === 1 ? 'story' : 'stories'}`}
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
          <ArticleFeed
            key={browseHref(state)}
            initialItems={articles}
            initialNext={next}
            total={total}
            query={state}
          />

          <noscript>
            <PaginationLinks
              page={state.page}
              totalPages={totalPages}
              hrefFor={(target) => browseHref(state, { page: target })}
              linkComponent={Link}
              label="Story pages"
              className="pt-4"
            />
          </noscript>
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-28">
            <PortalRightSidebar latestArticles={latest} />
          </div>
        </div>
      </div>
    </div>
  );
}
