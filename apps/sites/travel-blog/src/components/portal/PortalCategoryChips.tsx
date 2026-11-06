import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicCategory } from '@/lib/api';

interface PortalCategoryChipsProps {
  /** Real CMS topics that have published stories. */
  readonly categories: readonly PublicCategory[];
  readonly activeSlug: string | null;
}

const MAX_CHIPS = 6;

/**
 * Topic filters as links (`/articles?category=slug`): the filter runs on the
 * server across every story, is shareable, and works without JavaScript.
 */
export function PortalCategoryChips({ categories, activeSlug }: PortalCategoryChipsProps) {
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
      <nav aria-label="Filter by topic" className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const isActive = activeSlug === chip.slug;
          return (
            <Link
              key={chip.label}
              href={chip.slug ? `/articles?category=${chip.slug}` : '/articles'}
              aria-current={isActive ? 'true' : undefined}
              scroll={false}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>

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
