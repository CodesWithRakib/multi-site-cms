import type { ComponentType, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { getPageWindow } from '../lib/page-window';

export interface PaginationLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly 'aria-label'?: string;
  readonly 'aria-current'?: 'page';
  readonly rel?: string;
}

export interface PaginationLinksProps {
  readonly page: number;
  readonly totalPages: number;
  /** URL of a page; keep other query parameters (filters) in it. */
  readonly hrefFor: (page: number) => string;
  /** Router-aware link (Next.js `Link`); keeps this package framework-free. */
  readonly linkComponent: ComponentType<PaginationLinkProps>;
  /** Accessible name of the landmark, e.g. "Search result pages". */
  readonly label?: string;
  readonly className?: string;
}

const BUTTON =
  'inline-flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200';

const PREV = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const NEXT = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="size-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * Crawlable page links for server-rendered lists: every page is a real URL
 * (`?page=3`), so it works without JavaScript, can be shared and indexed, and
 * Back/Forward behave. Renders nothing for a single page.
 */
export function PaginationLinks({
  page,
  totalPages,
  hrefFor,
  linkComponent: PageLink,
  label = 'Pagination',
  className,
}: PaginationLinksProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(1, page), totalPages);

  return (
    <nav
      aria-label={label}
      className={cn('flex flex-wrap items-center justify-center gap-1.5', className)}
    >
      {current > 1 ? (
        <PageLink
          href={hrefFor(current - 1)}
          rel="prev"
          aria-label="Previous page"
          className={cn(BUTTON, 'border border-border hover:bg-muted')}
        >
          {PREV}
        </PageLink>
      ) : (
        <span aria-hidden="true" className={cn(BUTTON, 'border border-border opacity-40')}>
          {PREV}
        </span>
      )}

      {/* Phones: "3 / 12"; wider screens: the numbered window. */}
      <span className="px-2 text-sm font-semibold text-foreground sm:hidden">
        {current} / {totalPages}
      </span>
      <ul className="hidden items-center gap-1.5 sm:flex">
        {getPageWindow(current, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <PageLink
                href={hrefFor(item)}
                aria-current={item === current ? 'page' : undefined}
                aria-label={item === current ? undefined : `Page ${item}`}
                className={cn(
                  BUTTON,
                  item === current
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {item}
              </PageLink>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ),
        )}
      </ul>

      {current < totalPages ? (
        <PageLink
          href={hrefFor(current + 1)}
          rel="next"
          aria-label="Next page"
          className={cn(BUTTON, 'border border-border hover:bg-muted')}
        >
          {NEXT}
        </PageLink>
      ) : (
        <span aria-hidden="true" className={cn(BUTTON, 'border border-border opacity-40')}>
          {NEXT}
        </span>
      )}
    </nav>
  );
}
