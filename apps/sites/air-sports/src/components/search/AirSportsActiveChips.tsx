'use client';

import React from 'react';
import { Radio, X } from 'lucide-react';
import type { PublicPostSort } from '@multi-site-cms/types';

interface AirSportsActiveChipsProps {
  query: string;
  selectedCategory: string;
  categoryName?: string;
  selectedTag: string;
  tagName?: string;
  selectedSort: PublicPostSort;
  flightDuration: string;
  onClearQuery: () => void;
  onClearCategory: () => void;
  onClearTag: () => void;
  onClearSort: () => void;
  onClearFlightDuration: () => void;
  onClearAll: () => void;
}

export function AirSportsActiveChips({
  query,
  selectedCategory,
  categoryName,
  selectedTag,
  tagName,
  selectedSort,
  flightDuration,
  onClearQuery,
  onClearCategory,
  onClearTag,
  onClearSort,
  onClearFlightDuration,
  onClearAll,
}: AirSportsActiveChipsProps) {
  const hasActiveFilters = Boolean(
    query.trim() || selectedCategory || selectedTag || selectedSort !== 'newest' || flightDuration,
  );

  if (!hasActiveFilters) {
    return null;
  }

  const sortLabels: Record<PublicPostSort, string> = {
    newest: 'Latest Telemetry',
    oldest: 'Historical Archive',
    popular: 'Top Tracked',
    title_asc: 'Alphabetical (A–Z)',
  };

  const durationLabels: Record<string, string> = {
    short: 'Brief (< 5 min)',
    medium: 'Medium (5–10 min)',
    long: 'In-Depth (10+ min)',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
      <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
        <Radio className="h-3 w-3 text-primary animate-pulse" />
        <span>Active Radar Filters:</span>
      </div>

      {query.trim() && (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary shadow-2xs">
          <span>&ldquo;{query.trim()}&rdquo;</span>
          <button
            type="button"
            onClick={onClearQuery}
            aria-label="Remove search query"
            className="rounded-full hover:bg-primary/20 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedCategory && (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs">
          <span>Discipline: {categoryName || selectedCategory}</span>
          <button
            type="button"
            onClick={onClearCategory}
            aria-label="Remove discipline filter"
            className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedTag && (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs">
          <span>#{tagName || selectedTag}</span>
          <button
            type="button"
            onClick={onClearTag}
            aria-label="Remove tag filter"
            className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {selectedSort !== 'newest' && (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs">
          <span>Order: {sortLabels[selectedSort]}</span>
          <button
            type="button"
            onClick={onClearSort}
            aria-label="Reset sort"
            className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {flightDuration && (
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 font-mono text-xs font-semibold text-foreground shadow-2xs">
          <span>{durationLabels[flightDuration] || flightDuration}</span>
          <button
            type="button"
            onClick={onClearFlightDuration}
            aria-label="Remove flight duration filter"
            className="rounded-full hover:bg-muted p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onClearAll}
        className="font-mono text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 underline underline-offset-2 ml-1 cursor-pointer"
      >
        Reset All
      </button>
    </div>
  );
}
