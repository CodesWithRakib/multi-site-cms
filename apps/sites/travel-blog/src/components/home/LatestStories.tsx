import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { StoryCard } from './StoryCard';

interface LatestStoriesProps {
  readonly articles: readonly PublicArticleSummary[];
}

/** Editorial grid: one feature tile plus up to four regular stories. */
export function LatestStories({ articles }: LatestStoriesProps) {
  if (articles.length === 0) return null;
  const [feature, ...rest] = articles;

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
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
        >
          All stories
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {feature && (
          <div className="flex sm:col-span-2 lg:row-span-2">
            <StoryCard article={feature} size="feature" />
          </div>
        )}
        {rest.map((article) => (
          <StoryCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
