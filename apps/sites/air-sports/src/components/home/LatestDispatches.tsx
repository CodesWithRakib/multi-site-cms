import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { formatPublishedDate } from '@/lib/format';

import { DispatchVisual } from './DispatchVisual';

interface LatestDispatchesProps {
  readonly articles: readonly PublicArticleSummary[];
}

/** Image grid for dispatches beyond the top block; hidden when there are none. */
export function LatestDispatches({ articles }: LatestDispatchesProps) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="more-dispatches-heading"
      className="mx-auto max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <h2
          id="more-dispatches-heading"
          className="text-2xl font-black uppercase tracking-tight text-foreground"
        >
          More dispatches
        </h2>
        <Link
          href="/articles"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
        >
          View all
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article) => (
          <article key={article.id} className="group relative">
            <DispatchVisual
              article={article}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="aspect-4/3 rounded-2xl"
            />
            <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {formatPublishedDate(article.publishedAt)}
              {article.categories[0] && ` · ${article.categories[0].name}`}
            </p>
            <h3 className="mt-1 line-clamp-2 font-bold leading-snug text-foreground group-hover:text-primary">
              <Link href={`/articles/${article.slug}`} className="after:absolute after:inset-0">
                {article.title}
              </Link>
            </h3>
          </article>
        ))}
      </div>
    </section>
  );
}
