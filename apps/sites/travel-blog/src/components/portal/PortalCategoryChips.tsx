'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PortalCategoryChipsProps {
  activeSlug: string | null;
  onSelectCategory: (slug: string | null) => void;
}

const CHIP_CATEGORIES = [
  { label: 'All', slug: null },
  { label: 'Travel Tips', slug: 'travel-tips' },
  { label: 'Destinations', slug: 'destinations' },
  { label: 'Guides', slug: 'guides' },
  { label: 'Stories', slug: 'stories' },
];

export function PortalCategoryChips({ activeSlug, onSelectCategory }: PortalCategoryChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="flex flex-wrap items-center gap-2">
        {CHIP_CATEGORIES.map((chip) => {
          const isActive = activeSlug === chip.slug;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onSelectCategory(chip.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        <span>View All</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
