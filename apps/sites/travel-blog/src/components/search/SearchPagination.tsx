import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import { pageWindow, searchHref, type SearchState } from '@/lib/search-params';

interface SearchPaginationProps {
  readonly state: SearchState;
  readonly totalPages: number;
}

const circle =
  'inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200';

export function SearchPagination({ state, totalPages }: SearchPaginationProps) {
  if (totalPages <= 1) return null;
  const { page } = state;

  return (
    <nav aria-label="Search result pages" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={searchHref(state, { page: page - 1 })}
          aria-label="Previous page"
          className={cn(circle, 'border border-border hover:bg-muted')}
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(circle, 'border border-border opacity-40')}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(page, totalPages).map((entry, index) =>
        entry === null ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={searchHref(state, { page: entry })}
            aria-current={entry === page ? 'page' : undefined}
            className={cn(
              circle,
              entry === page
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-muted',
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={searchHref(state, { page: page + 1 })}
          aria-label="Next page"
          className={cn(circle, 'border border-border hover:bg-muted')}
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(circle, 'border border-border opacity-40')}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
