'use client';

import React from 'react';
import { ArrowUpDown, Clock, Compass, Tag as TagIcon } from 'lucide-react';
import type { PublicCategoryItem, PublicPostSort, PublicTagItem } from '@multi-site-cms/types';

interface AirSportsFacetSidebarProps {
  categories: PublicCategoryItem[];
  tags: PublicTagItem[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  selectedTag: string;
  onSelectTag: (slug: string) => void;
  selectedSort: PublicPostSort;
  onSelectSort: (sort: PublicPostSort) => void;
  flightDuration: string;
  onSelectFlightDuration: (duration: string) => void;
}

export function AirSportsFacetSidebar({
  categories,
  tags,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  selectedSort,
  onSelectSort,
  flightDuration,
  onSelectFlightDuration,
}: AirSportsFacetSidebarProps) {
  const SORT_OPTIONS: { label: string; value: PublicPostSort }[] = [
    { label: 'Latest Telemetry', value: 'newest' },
    { label: 'Top Tracked Dispatches', value: 'popular' },
    { label: 'Historical Transmissions', value: 'oldest' },
    { label: 'Alphabetical Index (A–Z)', value: 'title_asc' },
  ];

  const DURATION_OPTIONS = [
    { label: 'All Durations', value: '' },
    { label: 'Quick Telemetry (< 5 mins)', value: 'short' },
    { label: 'Standard Report (5–10 mins)', value: 'medium' },
    { label: 'Detailed Debrief (10+ mins)', value: 'long' },
  ];

  return (
    <aside className="space-y-6">
      {/* 1. Sorting Selector Card */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
          <span>Telemetry Order</span>
        </div>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = selectedSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectSort(opt.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Disciplines (Categories) Facet Card */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>Flight Disciplines</span>
          </div>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer lowercase"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer text-left ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            <span>All Disciplines</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? '' : cat.slug)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat.postCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Duration Filter */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>Dispatch Length</span>
        </div>
        <div className="space-y-1">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = flightDuration === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectFlightDuration(isSelected ? '' : opt.value)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Pilot & Route Tags */}
      {tags.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-2">
              <TagIcon className="h-3.5 w-3.5 text-primary" />
              <span>Telemetry Tags</span>
            </div>
            {selectedTag && (
              <button
                type="button"
                onClick={() => onSelectTag('')}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer lowercase"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 16).map((t) => {
              const isSelected = selectedTag === t.slug;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTag(isSelected ? '' : t.slug)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'border border-border bg-card hover:border-primary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>#{t.name}</span>
                  {t.postCount > 0 && <span className="text-[10px]">({t.postCount})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
