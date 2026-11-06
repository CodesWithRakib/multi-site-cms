'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicCategory } from '@/lib/api';

interface PortalCategoryChipsProps {
  /** Real CMS topics that have published stories. */
  readonly categories: readonly PublicCategory[];
  readonly activeSlug: string | null;
  readonly onSelectCategory: (slug: string | null) => void;
}

const MAX_CHIPS = 6;

export function PortalCategoryChips({
  categories,
  activeSlug,
  onSelectCategory,
}: PortalCategoryChipsProps) {
  const chips = [
    { label: 'All', slug: null },
    ...categories
      .filter((category) => category.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
      .slice(0, MAX_CHIPS)
      .map((category) => ({ label: category.name, slug: category.slug })),
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by topic">
        {chips.map((chip) => {
          const isActive = activeSlug === chip.slug;
          return (
            <button
              key={chip.label}
              type="button"
              aria-pressed={isActive}
              onClick={() => onSelectCategory(chip.slug)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
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
        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
      >
        <span>View All</span>
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
