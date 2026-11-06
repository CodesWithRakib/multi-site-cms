import Link from 'next/link';

import { PaginationLinks, pageHref } from '@multi-site-cms/ui';

import type { PublicArticle, PublicCategory } from '@/lib/api';

import { PortalArticleGrid } from './PortalArticleGrid';
import { PortalCategoryChips } from './PortalCategoryChips';
import { PortalHeroBanner } from './PortalHeroBanner';
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
  const base = activeCategorySlug ? `/articles?category=${activeCategorySlug}` : '/articles';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Panoramic Hero Banner */}
      <PortalHeroBanner />

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2" id="blogs-grid">
        {/* Left 8-Column Articles Section */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                Latest Travel Blogs
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Read our latest travel stories, tips and guides.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {total} {total === 1 ? 'Article' : 'Articles'}
            </span>
          </div>

          {/* Filter Chips */}
          <PortalCategoryChips categories={categories} activeSlug={activeCategorySlug} />

          {/* Article Grid */}
          <PortalArticleGrid articles={articles} />

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
