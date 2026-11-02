'use client';

import React, { useMemo, useState } from 'react';
import type { PublicArticle, PublicCategory } from '@/lib/api';
import { PortalCategoryChips } from './PortalCategoryChips';
import { PortalArticleGrid } from './PortalArticleGrid';
import { PortalRightSidebar } from './PortalRightSidebar';
import { PortalHeroBanner } from './PortalHeroBanner';

interface PortalContentContainerProps {
  initialArticles: PublicArticle[];
  categories: PublicCategory[];
}

export function PortalContentContainer({
  initialArticles,
  categories,
}: PortalContentContainerProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);

  // Filter articles by active category
  const filteredArticles = useMemo(() => {
    if (!activeCategorySlug) {
      return initialArticles;
    }
    return initialArticles.filter((article) =>
      article.categories?.some((cat: { slug: string }) => cat.slug === activeCategorySlug)
    );
  }, [initialArticles, activeCategorySlug]);

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
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>

          {/* Filter Chips */}
          <PortalCategoryChips
            activeSlug={activeCategorySlug}
            onSelectCategory={setActiveCategorySlug}
          />

          {/* 6-Card Article Grid */}
          <PortalArticleGrid articles={filteredArticles} />
        </div>

        {/* Right 4-Column Sticky Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-28">
            <PortalRightSidebar
              categories={categories}
              popularArticles={initialArticles}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
