import type { ComponentType, ReactNode } from 'react';
import { Search, X } from 'lucide-react';

import { BROWSE_PATH, BROWSE_SORTS, browseHref, type BrowseState } from '../lib/browse';
import { cn } from '../lib/cn';

/** Router-aware link (Next.js `Link`); keeps this package framework-free. */
export interface BrowseLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly children: ReactNode;
  readonly scroll?: boolean;
  readonly 'aria-current'?: 'true';
  readonly 'aria-label'?: string;
}
export type BrowseLink = ComponentType<BrowseLinkProps>;

/**
 * Plain GET form (works without JavaScript) that keeps the current topic, tag
 * and sort while the search text changes. The element id is `search`, so a
 * link to `/articles#search` lands on it.
 */
export function BrowseSearchForm({
  state,
  placeholder = 'Search…',
  className,
}: {
  readonly state: BrowseState;
  readonly placeholder?: string;
  readonly className?: string;
}) {
  return (
    <form
      action={BROWSE_PATH}
      role="search"
      id="search"
      className={cn('relative max-w-xl scroll-mt-24', className)}
    >
      {state.category && <input type="hidden" name="category" value={state.category} />}
      {state.tag && <input type="hidden" name="tag" value={state.tag} />}
      {state.sort !== 'newest' && <input type="hidden" name="sort" value={state.sort} />}
      <label htmlFor="browse-q" className="sr-only">
        Search
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="browse-q"
        name="q"
        type="search"
        defaultValue={state.q}
        maxLength={100}
        placeholder={placeholder}
        className="h-13 w-full rounded-full border border-border bg-card pl-12 pr-28 text-base text-foreground shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 inline-flex h-10 -translate-y-1/2 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}

/** Order of the list, as links so it is shareable and works without JavaScript. */
export function BrowseSortTabs({
  state,
  linkComponent: LinkComponent,
}: {
  readonly state: BrowseState;
  readonly linkComponent: BrowseLink;
}) {
  return (
    <nav aria-label="Sort" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
      {BROWSE_SORTS.map((sort) => (
        <LinkComponent
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
        </LinkComponent>
      ))}
    </nav>
  );
}

export interface BrowseTopic {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly postCount: number;
}

const CHIP =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors';
const CHIP_ON = 'bg-primary text-primary-foreground shadow-sm';
const CHIP_OFF =
  'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground';

/**
 * The page's one topic filter, as links: it runs on the server across every
 * item, is shareable, and works without JavaScript. Choosing a topic keeps the
 * search text and sort. Topics without published items are hidden; there are no
 * counts, since the list itself says how many match.
 */
export function BrowseTopicChips({
  topics,
  state,
  linkComponent: LinkComponent,
  label,
}: {
  readonly topics: readonly BrowseTopic[];
  readonly state: BrowseState;
  readonly linkComponent: BrowseLink;
  /** Accessible name of the filter, e.g. "Filter by topic". */
  readonly label: string;
}) {
  const visible = topics
    .filter((topic) => topic.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));

  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-2">
      <LinkComponent
        href={browseHref(state, { category: '' })}
        aria-current={state.category === '' ? 'true' : undefined}
        scroll={false}
        className={cn(CHIP, state.category === '' ? CHIP_ON : CHIP_OFF)}
      >
        All
      </LinkComponent>
      {visible.map((topic) => {
        const active = state.category === topic.slug;
        return (
          <LinkComponent
            key={topic.id}
            href={browseHref(state, { category: topic.slug })}
            aria-current={active ? 'true' : undefined}
            scroll={false}
            className={cn(CHIP, active ? CHIP_ON : CHIP_OFF)}
          >
            {topic.name}
          </LinkComponent>
        );
      })}
      {state.tag && (
        <LinkComponent
          href={browseHref(state, { tag: '' })}
          scroll={false}
          aria-label={`Remove tag filter: ${state.tag}`}
          className={cn(CHIP, CHIP_ON)}
        >
          #{state.tag}
          <X aria-hidden="true" className="size-3.5" />
        </LinkComponent>
      )}
    </nav>
  );
}
