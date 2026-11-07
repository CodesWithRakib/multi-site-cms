import Link from 'next/link';

import { cn } from '@multi-site-cms/ui';

import { BROWSE_SORTS, browseHref, type BrowseState } from '@/lib/browse-params';

/** Order of the list, as links so it is shareable and works without JavaScript. */
export function BrowseSortTabs({ state }: { readonly state: BrowseState }) {
  return (
    <nav aria-label="Sort stories" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
      {BROWSE_SORTS.map((sort) => (
        <Link
          key={sort.value}
          href={browseHref(state, { sort: sort.value })}
          scroll={false}
          aria-current={state.sort === sort.value ? 'true' : undefined}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
            state.sort === sort.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {sort.label}
        </Link>
      ))}
    </nav>
  );
}
