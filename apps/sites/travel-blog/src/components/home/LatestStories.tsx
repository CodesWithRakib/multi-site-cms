import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { StoryCard } from './StoryCard';

interface LatestStoriesProps {
  readonly articles: readonly PublicArticleSummary[];
}

type GridLayout = 'quad' | 'stack' | 'pair';

/**
 * Picks a layout that leaves no empty cells next to the feature tile:
 * 4+ stories → 2×2 beside it, 2–3 → a column of two, 0–1 → side by side.
 */
function chooseLayout(secondaryCount: number): GridLayout {
  if (secondaryCount >= 4) return 'quad';
  if (secondaryCount >= 2) return 'stack';
  return 'pair';
}

const VISIBLE: Record<GridLayout, number> = { quad: 4, stack: 2, pair: 1 };

/** Editorial grid: one feature tile plus up to four regular stories. */
export function LatestStories({ articles }: LatestStoriesProps) {
  if (articles.length === 0) return null;
  const [feature, ...rest] = articles;
  const layout = chooseLayout(rest.length);
  const secondary = rest.slice(0, VISIBLE[layout]);

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

      <div
        className={cn(
          'grid gap-x-5 gap-y-8 sm:grid-cols-2',
          layout === 'quad' && 'lg:grid-cols-4',
          layout === 'stack' && 'lg:grid-cols-3',
        )}
      >
        {feature && (
          <div
            className={cn(
              'flex',
              secondary.length !== 1 && 'sm:col-span-2',
              layout !== 'pair' && 'lg:row-span-2',
            )}
          >
            <StoryCard article={feature} size="feature" />
          </div>
        )}
        {secondary.map((article) => (
          <StoryCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
