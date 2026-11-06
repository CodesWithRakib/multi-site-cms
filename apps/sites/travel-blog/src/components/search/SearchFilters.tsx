import Link from 'next/link';
import { Check, LayoutGrid, Tag as TagIcon } from 'lucide-react';

import type { PublicCategoryItem, PublicTagItem } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { searchHref, type SearchState } from '@/lib/search-params';

interface SearchFiltersProps {
  readonly state: SearchState;
  readonly categories: readonly PublicCategoryItem[];
  readonly tags: readonly PublicTagItem[];
  /** Published stories on the site (the "All" count). */
  readonly totalStories: number;
}

const TAG_LIMIT = 14;

/** Category and tag filters. Counts are published-story counts from the API. */
export function SearchFilters({ state, categories, tags, totalStories }: SearchFiltersProps) {
  const visibleCategories = categories.filter(
    (category) => category.postCount > 0 || category.slug === state.category,
  );
  const visibleTags = tags
    .filter((tag) => tag.postCount > 0 || tag.slug === state.tag)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, TAG_LIMIT);

  const row = (active: boolean) =>
    cn(
      'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
      active
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-foreground/80 hover:bg-muted hover:text-foreground',
    );
  const count = (active: boolean) =>
    cn(
      'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
    );

  return (
    <div className="space-y-7">
      <section aria-labelledby="filter-categories">
        <h2
          id="filter-categories"
          className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-foreground"
        >
          <LayoutGrid aria-hidden="true" className="size-4 text-primary" />
          Categories
        </h2>
        <ul className="space-y-0.5">
          <li>
            <Link
              href={searchHref(state, { category: '' })}
              aria-current={state.category === '' ? 'true' : undefined}
              className={row(state.category === '')}
            >
              <span className="flex items-center gap-2">
                {state.category === '' && <Check aria-hidden="true" className="size-4" />}
                All categories
              </span>
              <span className={count(state.category === '')}>{totalStories}</span>
            </Link>
          </li>
          {visibleCategories.map((category) => {
            const active = category.slug === state.category;
            return (
              <li key={category.id}>
                <Link
                  href={searchHref(state, { category: active ? '' : category.slug })}
                  aria-current={active ? 'true' : undefined}
                  className={row(active)}
                >
                  <span className="flex items-center gap-2">
                    {active && <Check aria-hidden="true" className="size-4" />}
                    {category.name}
                  </span>
                  <span className={count(active)}>{category.postCount}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {visibleTags.length > 0 && (
        <section aria-labelledby="filter-tags">
          <h2
            id="filter-tags"
            className="mb-3 flex items-center gap-2 px-1 text-sm font-bold text-foreground"
          >
            <TagIcon aria-hidden="true" className="size-4 text-primary" />
            Popular tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag) => {
              const active = tag.slug === state.tag;
              return (
                <Link
                  key={tag.id}
                  href={searchHref(state, { tag: active ? '' : tag.slug })}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary',
                  )}
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
