'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Clock,
  Compass,
  Loader2,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  PublicArticleSummary,
  PublicCategoryItem,
  PublicPostSort,
  PublicTagItem,
} from '@multi-site-cms/types';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { SearchActiveChips } from './SearchActiveChips';
import { SearchFacetSidebar } from './SearchFacetSidebar';
import { SearchHighlight } from './SearchHighlight';

interface SearchClientContainerProps {
  initialArticles: PublicArticleSummary[];
  initialTotal: number;
  categories: PublicCategoryItem[];
  tags: PublicTagItem[];
  initialQuery?: string;
  initialCategory?: string;
  initialTag?: string;
  initialSort?: PublicPostSort;
}

export function SearchClientContainer({
  initialArticles,
  initialTotal,
  categories,
  tags,
  initialQuery = '',
  initialCategory = '',
  initialTag = '',
  initialSort = 'newest',
}: SearchClientContainerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedSort, setSelectedSort] = useState<PublicPostSort>(initialSort);
  const [readingTimeFilter, setReadingTimeFilter] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [articles, setArticles] = useState<PublicArticleSummary[]>(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Sync URL query params with state
  const syncUrl = useCallback(
    (q: string, cat: string, tag: string, sort: PublicPostSort) => {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (cat) params.set('category', cat);
      if (tag) params.set('tag', tag);
      if (sort !== 'newest') params.set('sort', sort);

      const qs = params.toString();
      const newUrl = qs ? `/search?${qs}` : '/search';
      window.history.replaceState(null, '', newUrl);
    },
    [],
  );

  // Fetch updated search results from proxy API
  const executeSearch = useCallback(
    async (q: string, cat: string, tag: string, sort: PublicPostSort) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        if (cat) params.set('category', cat);
        if (tag) params.set('tag', tag);
        if (sort) params.set('sort', sort);
        params.set('limit', '24');

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error('[Search] Failed to fetch search results:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced effect whenever query, category, tag, or sort changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      syncUrl(query, selectedCategory, selectedTag, selectedSort);
      executeSearch(query, selectedCategory, selectedTag, selectedSort);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedCategory, selectedTag, selectedSort, syncUrl, executeSearch]);

  // Client-side reading time filter
  const displayedArticles = useMemo(() => {
    if (!readingTimeFilter) return articles;
    return articles.filter((art) => {
      const mins = art.readingTimeMinutes || 1;
      if (readingTimeFilter === 'quick') return mins < 5;
      if (readingTimeFilter === 'medium') return mins >= 5 && mins <= 10;
      if (readingTimeFilter === 'long') return mins > 10;
      return true;
    });
  }, [articles, readingTimeFilter]);

  const activeCategoryName = categories.find((c) => c.slug === selectedCategory)?.name;
  const activeTagName = tags.find((t) => t.slug === selectedTag)?.name;

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedSort('newest');
    setReadingTimeFilter('');
  };

  return (
    <div className="space-y-8">
      {/* 1. Global Search Input & Quick Controls */}
      <div className="relative rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dispatches, destinations, food, culture, hiking..."
            aria-label="Search dispatches and destinations"
            className="w-full rounded-2xl border border-border/80 bg-neutral-100/70 dark:bg-neutral-800/60 pl-12 pr-12 py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search input"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-600" />
          ) : null}
        </div>

        {/* Mobile Filter Toggle & Summary Bar */}
        <div className="flex items-center justify-between pt-1">
          <SearchActiveChips
            query={query}
            selectedCategory={selectedCategory}
            categoryName={activeCategoryName}
            selectedTag={selectedTag}
            tagName={activeTagName}
            selectedSort={selectedSort}
            readingTimeFilter={readingTimeFilter}
            onClearQuery={() => setQuery('')}
            onClearCategory={() => setSelectedCategory('')}
            onClearTag={() => setSelectedTag('')}
            onClearSort={() => setSelectedSort('newest')}
            onClearReadingTime={() => setReadingTimeFilter('')}
            onClearAll={handleClearAll}
          />

          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted cursor-pointer shrink-0 ml-auto"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Main 12-Column Faceted Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4-Column Facet Sidebar (Desktop & Mobile Drawer) */}
        <div
          className={`lg:col-span-4 ${
            mobileFilterOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="sticky top-28">
            <SearchFacetSidebar
              categories={categories}
              tags={tags}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
              readingTimeFilter={readingTimeFilter}
              onSelectReadingTime={setReadingTimeFilter}
            />
          </div>
        </div>

        {/* Right 8-Column Articles Results Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Results Counter Header */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3 text-xs sm:text-sm text-muted-foreground">
            <span>
              Showing <strong>{displayedArticles.length}</strong>{' '}
              {displayedArticles.length === 1 ? 'dispatch' : 'dispatches'}
              {total > displayedArticles.length ? ` (out of ${total} total)` : ''}
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
              </span>
            )}
          </div>

          {/* Results Grid */}
          {displayedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedArticles.map((article) => {
                const primaryCat = article.categories?.[0];
                return (
                  <article
                    key={article.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div>
                      {/* Media Image */}
                      <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <Image
                          src={
                            article.featuredImage?.url ||
                            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
                          }
                          alt={article.featuredImage?.altText || article.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {primaryCat && (
                          <div className="absolute left-3 top-3 z-10">
                            <CategoryBadge label={primaryCat.name} slug={primaryCat.slug} />
                          </div>
                        )}
                        <div className="absolute right-3 top-3 z-10">
                          <BookmarkButton
                            articleId={article.id}
                            articleSlug={article.slug}
                            articleTitle={article.title}
                            featuredImageUrl={article.featuredImage?.url}
                            categoryName={primaryCat?.name}
                            readingTimeMinutes={article.readingTimeMinutes}
                          />
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {article.publishedAt
                              ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readingTimeMinutes || 3} min read
                          </span>
                        </div>

                        <h3 className="font-serif text-lg font-bold tracking-tight text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2">
                          <Link href={`/articles/${article.slug}`}>
                            <SearchHighlight text={article.title} query={query} />
                          </Link>
                        </h3>

                        {article.excerpt && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            <SearchHighlight text={article.excerpt} query={query} />
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-1 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline inline-flex items-center gap-1">
                        Read Story <ArrowRight className="h-3 w-3" />
                      </span>
                      <Link
                        href={`/articles/${article.slug}`}
                        aria-label={`Read ${article.title}`}
                        className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Empty State with Smart Suggestions */
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 bg-card/50">
              <Compass className="h-12 w-12 text-emerald-500/50 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-foreground">
                  No Dispatches Found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  We could not find any published dispatches matching your selected criteria. Try
                  searching for broader topics or click below to reset.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Clear All Filters
                </button>
                {categories.slice(0, 3).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSelectedCategory(cat.slug);
                    }}
                    className="px-3.5 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-xs font-medium text-foreground cursor-pointer"
                  >
                    Browse {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
