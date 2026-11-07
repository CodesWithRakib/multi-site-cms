import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { ArticleCard } from '@/components/cards/ArticleCard';

interface MoreStoriesProps {
  readonly articles: readonly PublicArticleSummary[];
  /** Published stories in total, so the call to action is honest about what is left. */
  readonly total: number;
}

/** A fuller grid of further stories, ending in a clear way to browse everything. */
export function MoreStories({ articles, total }: MoreStoriesProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="more-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Keep exploring
          </p>
          <h2
            id="more-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            More stories
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Link
          href="/articles"
          className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-7 text-sm font-bold text-background transition-opacity hover:opacity-90"
        >
          Browse all {total} {total === 1 ? 'story' : 'stories'}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
