'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Radio, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import type {
  PublicArticleSummary,
  PublicCategoryItem,
  PublicPostSort,
  PublicTagItem,
} from '@multi-site-cms/types';
import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { AirSportsActiveChips } from './AirSportsActiveChips';
import { AirSportsFacetSidebar } from './AirSportsFacetSidebar';

interface AirSportsSearchContainerProps {
  initialArticles: PublicArticleSummary[];
  initialTotal: number;
  categories: PublicCategoryItem[];
  tags: PublicTagItem[];
  initialQuery?: string;
  initialCategory?: string;
  initialTag?: string;
  initialSort?: PublicPostSort;
}

export function AirSportsSearchContainer({
  initialArticles,
  initialTotal,
  categories,
  tags,
  initialQuery = '',
  initialCategory = '',
  initialTag = '',
  initialSort = 'newest',
}: AirSportsSearchContainerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [selectedSort, setSelectedSort] = useState<PublicPostSort>(initialSort);
  const [flightDuration, setFlightDuration] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [articles, setArticles] = useState<PublicArticleSummary[]>(initialArticles);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Sync browser URL search params
  const syncUrl = useCallback((q: string, cat: string, tag: string, sort: PublicPostSort) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (cat) params.set('category', cat);
    if (tag) params.set('tag', tag);
    if (sort !== 'newest') params.set('sort', sort);

    const qs = params.toString();
    const newUrl = qs ? `/search?${qs}` : '/search';
    window.history.replaceState(null, '', newUrl);
  }, []);

  // Live search execution via internal proxy endpoint
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
        console.error('[Air Sports Search] Live search failed:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced search trigger
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
    if (!flightDuration) return articles;
    return articles.filter((art) => {
      const mins = art.readingTimeMinutes || 1;
      if (flightDuration === 'short') return mins < 5;
      if (flightDuration === 'medium') return mins >= 5 && mins <= 10;
      if (flightDuration === 'long') return mins > 10;
      return true;
    });
  }, [articles, flightDuration]);

  const activeCategoryName = categories.find((c) => c.slug === selectedCategory)?.name;
  const activeTagName = tags.find((t) => t.slug === selectedTag)?.name;

  const handleClearAll = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedSort('newest');
    setFlightDuration('');
  };

  return (
    <div className="space-y-8">
      {/* 1. Radar Search Control Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-primary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by keywords, flight zones, paragliding, wingsuit..."
            aria-label="Search radar query"
            className="w-full rounded-2xl border border-border bg-muted/60 pl-12 pr-12 py-3.5 font-mono text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-inner"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear radar query"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted cursor-pointer"
            >
              <X className="size-4" />
            </button>
          ) : isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 animate-spin text-primary" />
          ) : null}
        </div>

        {/* Active Radar Chips */}
        <div className="flex items-center justify-between pt-1">
          <AirSportsActiveChips
            query={query}
            selectedCategory={selectedCategory}
            categoryName={activeCategoryName}
            selectedTag={selectedTag}
            tagName={activeTagName}
            selectedSort={selectedSort}
            flightDuration={flightDuration}
            onClearQuery={() => setQuery('')}
            onClearCategory={() => setSelectedCategory('')}
            onClearTag={() => setSelectedTag('')}
            onClearSort={() => setSelectedSort('newest')}
            onClearFlightDuration={() => setFlightDuration('')}
            onClearAll={handleClearAll}
          />

          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card font-mono text-xs font-bold text-foreground hover:bg-muted cursor-pointer shrink-0 ml-auto"
          >
            <SlidersHorizontal className="size-3.5 text-primary" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Faceted Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 4-Column Facets */}
        <div className={`lg:col-span-4 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-28">
            <AirSportsFacetSidebar
              categories={categories}
              tags={tags}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              selectedSort={selectedSort}
              onSelectSort={setSelectedSort}
              flightDuration={flightDuration}
              onSelectFlightDuration={setFlightDuration}
            />
          </div>
        </div>

        {/* Right 8-Column Dispatches Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-xs text-muted-foreground">
            <span>
              Radar Tracked: <strong>{displayedArticles.length}</strong>{' '}
              {displayedArticles.length === 1 ? 'dispatch' : 'dispatches'}
              {total > displayedArticles.length ? ` (out of ${total} total)` : ''}
            </span>
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-primary font-mono font-medium">
                <Loader2 className="size-3.5 animate-spin" /> Scanning...
              </span>
            )}
          </div>

          {/* Grid */}
          {displayedArticles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {displayedArticles.map((article) => (
                <AirSportsCard key={article.id} article={article} variant="standard" />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 bg-card/60">
              <Radio className="size-12 text-primary/40 mx-auto animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-mono text-lg font-bold uppercase tracking-wider text-foreground">
                  Zero Radar Signals Detected
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No transmissions matched your active query. Adjust telemetry filters or reset to
                  all frequencies.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
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
                    className="px-3.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted font-mono text-xs text-foreground cursor-pointer"
                  >
                    #{cat.name}
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
