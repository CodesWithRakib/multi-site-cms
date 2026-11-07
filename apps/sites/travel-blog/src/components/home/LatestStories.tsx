import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { Reveal } from '@/components/ui/Reveal';

import { CompactStoryRow } from './CompactStoryRow';
import { FeatureStoryCard } from './FeatureStoryCard';

interface LatestStoriesProps {
  readonly articles: readonly PublicArticleSummary[];
}

/** Large stories on the left, compact rows on the right. */
const FEATURED = 2;
const COMPACT = 4;

/**
 * Editorial split: the two newest stories as large cover tiles on the left and
 * the next four as a compact list on the right. With fewer stories the page
 * still fills out: one or two stories span the full width, and three or more
 * fill the right column as stories arrive. On phones the large tiles come
 * first, then the list.
 */
export function LatestStories({ articles }: LatestStoriesProps) {
  if (articles.length === 0) return null;
  const featured = articles.slice(0, FEATURED);
  const compact = articles.slice(FEATURED, FEATURED + COMPACT);
  const hasList = compact.length > 0;

  return (
    <section aria-labelledby="latest-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Fresh from the road
          </p>
          <h2
            id="latest-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Latest stories
          </h2>
        </div>
        <Link
          href="/articles"
          className="touch-target group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
        >
          All stories
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className={cn('grid gap-5', hasList && 'lg:grid-cols-12 lg:gap-6')}>
        <div
          className={cn('grid gap-5', hasList ? 'lg:col-span-7 lg:grid-rows-2' : 'sm:grid-cols-2')}
        >
          {featured.map((article, index) => (
            <Reveal key={article.id} delay={index * 100} className="flex">
              <div className="flex w-full">
                <FeatureStoryCard article={article} priority={index === 0} />
              </div>
            </Reveal>
          ))}
        </div>

        {hasList && (
          <ul
            className={cn(
              'grid overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs lg:col-span-5',
              // A short list keeps its natural height instead of stretching into an empty card.
              compact.length < 3 && 'lg:self-start',
            )}
            style={{ gridTemplateRows: `repeat(${compact.length}, minmax(0, 1fr))` }}
          >
            {compact.map((article, index) => (
              <li key={article.id} className={cn(index > 0 && 'border-t border-border/70')}>
                <CompactStoryRow article={article} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
