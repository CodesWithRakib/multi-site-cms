'use client';

import React, { useMemo, useState } from 'react';
import type { PublicArticle, PublicCategory } from '@/lib/api';
import { PortalCategoryChips } from './PortalCategoryChips';
import { PortalArticleGrid } from './PortalArticleGrid';
import { PortalRightSidebar } from './PortalRightSidebar';
import { PortalHeroBanner } from './PortalHeroBanner';
import { PortalTopBar } from './PortalTopBar';
import { SpruceSidebar } from './SpruceSidebar';

interface PortalContentContainerProps {
  initialArticles: PublicArticle[];
  categories: PublicCategory[];
}

export function PortalContentContainer({
  initialArticles,
  categories,
}: PortalContentContainerProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    <div className="flex min-h-screen bg-background text-foreground antialiased transition-colors">
      {/* Left Spruce Sidebar (Desktop Fixed / Mobile Drawer) */}
      <SpruceSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Reader Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Search & Actions Bar */}
        <PortalTopBar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Panoramic Hero Banner */}
          <PortalHeroBanner />

          {/* 2-Column Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2" id="blogs-grid">
            {/* Left 8-Column Articles Section */}
            <div className="lg:col-span-8 space-y-6">
              {/* Section Header */}
              <div className="space-y-1 border-l-4 border-emerald-500 pl-3">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                  Latest Travel Blogs
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Read our latest travel stories, tips and guides.
                </p>
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
        </main>
      </div>
    </div>
  );
}
