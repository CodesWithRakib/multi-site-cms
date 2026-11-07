import { Search } from 'lucide-react';

import { BROWSE_PATH, type BrowseState } from '@/lib/browse-params';

/**
 * Plain GET form (works without JavaScript) that keeps the current topic, tag
 * and sort while the search text changes.
 */
export function BrowseSearchForm({ state }: { readonly state: BrowseState }) {
  return (
    <form
      action={BROWSE_PATH}
      role="search"
      id="search"
      className="relative mt-5 max-w-xl scroll-mt-24"
    >
      {state.category && <input type="hidden" name="category" value={state.category} />}
      {state.tag && <input type="hidden" name="tag" value={state.tag} />}
      {state.sort !== 'newest' && <input type="hidden" name="sort" value={state.sort} />}
      <label htmlFor="browse-q" className="sr-only">
        Search stories
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
        placeholder="Search places, routes and tips…"
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
