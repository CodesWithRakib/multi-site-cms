import Link from 'next/link';
import { Radio } from 'lucide-react';

import { BROWSE_PATH, isFiltered, type BrowseState } from '@multi-site-cms/ui';
import type { PublicArticleSummary } from '@multi-site-cms/types';

import { AirSportsCard } from '@/components/cards/AirSportsCard';

interface DispatchGridProps {
  readonly articles: readonly PublicArticleSummary[];
  readonly query: BrowseState;
}

/** The dispatches, or one empty state for "nothing yet", "nothing in this discipline" and "no match". */
export function DispatchGrid({ articles, query }: DispatchGridProps) {
  if (articles.length === 0) {
    const filtered = isFiltered(query);
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center sm:p-16">
        <Radio className="mx-auto mb-3 size-10 text-muted-foreground/40" aria-hidden="true" />
        <h2 className="text-base font-bold text-foreground">
          {query.q
            ? 'Nothing matches your search'
            : filtered
              ? 'No dispatches here yet'
              : 'No dispatches published yet'}
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          {filtered
            ? 'Try a shorter word or another discipline, or clear the filters.'
            : 'Check back soon, or follow live events as they happen.'}
        </p>
        <Link
          href={filtered ? BROWSE_PATH : '/events'}
          className="mt-4 inline-flex min-h-11 items-center gap-1 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {filtered ? 'Show all dispatches' : 'View live events'}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <AirSportsCard
          key={article.id}
          article={article}
          variant="standard"
          priority={index < 3}
          highlight={query.q}
        />
      ))}
    </div>
  );
}
