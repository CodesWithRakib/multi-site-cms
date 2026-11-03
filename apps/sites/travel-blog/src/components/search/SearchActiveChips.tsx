'use client';

import React from 'react';
import { Filter, X } from 'lucide-react';
import type { PublicPostSort } from '@multi-site-cms/types';

interface SearchActiveChipsProps {
  query: string;
  selectedCategory: string;
  categoryName?: string;
  selectedTag: string;
  tagName?: string;
  selectedSort: PublicPostSort;
  readingTimeFilter: string;
  onClearQuery: () => void;
  onClearCategory: () => void;
  onClearTag: () => void;
  onClearSort: () => void;
  onClearReadingTime: () => void;
  onClearAll: () => void;
}

export function SearchActiveChips({
  query,
  selectedCategory,
  categoryName,
  selectedTag,
  tagName,
  selectedSort,
  readingTimeFilter,
  onClearQuery,
  onClearCategory,
  onClearTag,
  onClearSort,
  onClearReadingTime,
  onClearAll,
}: SearchActiveChipsProps) {
  const hasActiveFilters = Boolean(
    query.trim() ||
    selectedCategory ||
    selectedTag ||
    selectedSort !== 'newest' ||
    readingTimeFilter,
  );

  if (!hasActiveFilters) {
    return null;
  }

  const sortLabels: Record<PublicPostSort, string> = {
    newest: 'Newest',
    oldest: 'Oldest First',
    popular: 'Most Popular',
    title_asc: 'Alphabetical (A–Z)',
  };

  const readingTimeLabels: Record<string, string> = {
    quick: 'Under 5 mins',
    medium: '5–10 mins',
    long: '10+ mins',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
        <Filter className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Active Filters:</span>
      </div>

      {query.trim() && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200 shadow-2xs">
          <span>&ldquo;{query.trim()}&rdquo;</span>
          <button
            type="button"
            onClick={onClearQuery}
            aria-label="Remove search query filter"
            className="rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedCategory && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-200 shadow-2xs">
          <span>Category: {categoryName || selectedCategory}</span>
          <button
            type="button"
            onClick={onClearCategory}
            aria-label="Remove category filter"
            className="rounded-full hover:bg-teal-200 dark:hover:bg-teal-800 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedTag && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200 shadow-2xs">
          <span>#{tagName || selectedTag}</span>
          <button
            type="button"
            onClick={onClearTag}
            aria-label="Remove tag filter"
            className="rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedSort !== 'newest' && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200 shadow-2xs">
          <span>Sort: {sortLabels[selectedSort]}</span>
          <button
            type="button"
            onClick={onClearSort}
            aria-label="Reset sort to newest"
            className="rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {readingTimeFilter && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200 shadow-2xs">
          <span>Reading: {readingTimeLabels[readingTimeFilter] || readingTimeFilter}</span>
          <button
            type="button"
            onClick={onClearReadingTime}
            aria-label="Remove reading time filter"
            className="rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-2 ml-1 cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
}
