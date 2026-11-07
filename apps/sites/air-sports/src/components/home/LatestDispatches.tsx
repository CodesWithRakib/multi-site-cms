import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { AirSportsCard } from '@/components/cards/AirSportsCard';

interface LatestDispatchesProps {
  readonly articles: readonly PublicArticleSummary[];
  /** Every published dispatch, so the button is honest about what is behind it. */
  readonly total: number;
}

/** The closing grid of dispatches; hidden when there are none beyond the top block. */
export function LatestDispatches({ articles, total }: LatestDispatchesProps) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="more-dispatches-heading"
      className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <h2
          id="more-dispatches-heading"
          className="text-2xl font-black uppercase tracking-tight text-foreground"
        >
          More dispatches
        </h2>
      </div>

      {/* The layout follows the count, so a few dispatches never leave empty columns. */}
      {articles.length === 1 && articles[0] ? (
        <AirSportsCard article={articles[0]} variant="hero" />
      ) : (
        <div className={cn('grid gap-5 sm:grid-cols-2', articles.length > 2 && 'lg:grid-cols-3')}>
          {articles.map((article) => (
            <AirSportsCard key={article.id} article={article} variant="standard" />
          ))}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <Link
          href="/articles"
          className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-7 font-mono text-xs font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90"
        >
          Browse all {total} {total === 1 ? 'dispatch' : 'dispatches'}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
