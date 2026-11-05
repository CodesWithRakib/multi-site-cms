'use client';

import React from 'react';
import { ArrowUpDown, Clock, FolderKanban, Tag as TagIcon } from 'lucide-react';
import type { PublicCategoryItem, PublicPostSort, PublicTagItem } from '@multi-site-cms/types';

interface SearchFacetSidebarProps {
  categories: PublicCategoryItem[];
  tags: PublicTagItem[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  selectedTag: string;
  onSelectTag: (slug: string) => void;
  selectedSort: PublicPostSort;
  onSelectSort: (sort: PublicPostSort) => void;
  readingTimeFilter: string;
  onSelectReadingTime: (val: string) => void;
}

export function SearchFacetSidebar({
  categories,
  tags,
  selectedCategory,
  onSelectCategory,
  selectedTag,
  onSelectTag,
  selectedSort,
  onSelectSort,
  readingTimeFilter,
  onSelectReadingTime,
}: SearchFacetSidebarProps) {
  const SORT_OPTIONS: { label: string; value: PublicPostSort }[] = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Oldest Dispatches', value: 'oldest' },
    { label: 'Title (A–Z)', value: 'title_asc' },
  ];

  const READING_TIME_OPTIONS = [
    { label: 'Any Duration', value: '' },
    { label: 'Quick Read (< 5 mins)', value: 'quick' },
    { label: 'Medium Read (5–10 mins)', value: 'medium' },
    { label: 'Deep Dive (10+ mins)', value: 'long' },
  ];

  return (
    <aside className="space-y-6">
      {/* 1. Sorting Selector Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <ArrowUpDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Sort By</span>
        </div>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = selectedSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelectSort(opt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Categories Facet Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Categories</span>
          </div>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer lowercase"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
              !selectedCategory
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? '' : cat.slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-emerald-700/80 text-white'
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

      {/* 3. Reading Time Facet */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Reading Time</span>
        </div>
        <div className="space-y-1">
          {READING_TIME_OPTIONS.map((timeOpt) => {
            const isSelected = readingTimeFilter === timeOpt.value;
            return (
              <button
                key={timeOpt.value}
                type="button"
                onClick={() => onSelectReadingTime(isSelected ? '' : timeOpt.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{timeOpt.label}</span>
                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Popular Tags Cloud */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-2">
              <TagIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Popular Tags</span>
            </div>
            {selectedTag && (
              <button
                type="button"
                onClick={() => onSelectTag('')}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer lowercase"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.slice(0, 15).map((t) => {
              const isSelected = selectedTag === t.slug;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTag(isSelected ? '' : t.slug)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-border/70 bg-card hover:border-emerald-500/50 hover:text-emerald-600 text-muted-foreground'
                  }`}
                >
                  <span>#{t.name}</span>
                  {t.postCount > 0 && (
                    <span className="text-[10px]">({t.postCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

