import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { PaginationLinks, pageHref } from '@multi-site-cms/ui';

import type { PublicArticle, PublicCategory } from '@/lib/api';

import { PageHeader } from '@/components/ui/PageHeader';

import { PortalArticleGrid } from './PortalArticleGrid';
import { PortalCategoryChips } from './PortalCategoryChips';
import { PortalRightSidebar } from './PortalRightSidebar';

interface PortalContentContainerProps {
  /** The stories of the current page and topic filter, already loaded by the page. */
  readonly articles: PublicArticle[];
  readonly categories: PublicCategory[];
  readonly activeCategorySlug: string | null;
  readonly page: number;
  readonly totalPages: number;
  /** Stories matching the current filter across all pages. */
  readonly total: number;
}

/**
 * Stories portal layout. Filtering and paging happen on the server through the
 * URL (`?category=` and `?page=`), so every story is reachable, not just the
 * first page that was loaded.
 */
export function PortalContentContainer({
  articles,
  categories,
  activeCategorySlug,
  page,
  totalPages,
  total,
}: PortalContentContainerProps) {
  const activeCategory = categories.find((c) => c.slug === activeCategorySlug);
  const base = activeCategorySlug ? `/articles?category=${activeCategorySlug}` : '/articles';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <PageHeader
        eyebrow={
          <>
            <BookOpen aria-hidden="true" className="size-3.5" /> The Explorer Journal
          </>
        }
        title={
          activeCategory ? (
            activeCategory.name
          ) : (
            <>
              Travel stories &amp;{' '}
              <span className="font-handwriting text-4xl font-bold text-primary sm:text-6xl">
                guides
              </span>
            </>
          )
        }
        description={
          activeCategory?.description ||
          'Firsthand itineraries, practical field notes and the people and places behind them.'
        }
        meta={`${total} ${total === 1 ? 'story' : 'stories'}`}
        scene="mountains"
      />

      {/* Stories first on phones; the topic sidebar follows below them. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12" id="blogs-grid">
        <div className="space-y-6 lg:col-span-8">
          {/* Filter Chips */}
          <PortalCategoryChips categories={categories} activeSlug={activeCategorySlug} />

          {/* Article Grid */}
          <PortalArticleGrid articles={articles} filtered={Boolean(activeCategorySlug)} />

          <PaginationLinks
            page={page}
            totalPages={totalPages}
            hrefFor={(target) => pageHref(base, target)}
            linkComponent={Link}
            label="Story pages"
            className="pt-4"
          />
        </div>

        {/* Right 4-Column Sticky Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-28">
            <PortalRightSidebar categories={categories} latestArticles={articles} />
          </div>
        </div>
      </div>
    </div>
  );
}
