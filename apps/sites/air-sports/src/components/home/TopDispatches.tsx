import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Zap } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { formatPublishedDate } from '@/lib/format';

import { DispatchVisual } from './DispatchVisual';

interface TopDispatchesProps {
  readonly articles: readonly PublicArticleSummary[];
}

const WIRE_LIMIT = 6;

/**
 * Newsroom block under the hero: the next big story as a wide card, the
 * rest as a timestamped "wire" beside it. Dense by design.
 */
export function TopDispatches({ articles }: TopDispatchesProps) {
  const [top, ...others] = articles;
  if (!top) return null;
  const wire = others.slice(0, WIRE_LIMIT);
  const category = top.categories[0];

  return (
    <section
      aria-labelledby="dispatches-heading"
      className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8"
    >
      <h2 id="dispatches-heading" className="sr-only">
        Top dispatches
      </h2>

      <article className="group relative overflow-hidden rounded-3xl border border-border bg-card lg:col-span-2">
        <div className="relative">
          <DispatchVisual
            article={top}
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="aspect-16/9 lg:aspect-21/9"
          />
          {category && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Zap aria-hidden="true" className="size-3.5" />
              {category.name}
            </span>
          )}
        </div>
        <div className="p-5 sm:p-7">
          <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {category && <span className="text-primary">{category.name}</span>}
            <span>{formatPublishedDate(top.publishedAt)}</span>
            <span>· {top.readingTimeMinutes} min</span>
          </p>
          <h3 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight text-foreground text-balance sm:text-3xl">
            <Link
              href={`/articles/${top.slug}`}
              className="after:absolute after:inset-0 group-hover:text-primary"
            >
              {top.title}
            </Link>
          </h3>
          {top.excerpt && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {top.excerpt}
            </p>
          )}
        </div>
      </article>

      <aside
        aria-labelledby="wire-heading"
        className="flex flex-col rounded-3xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2
            id="wire-heading"
            className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.25em] text-foreground"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            The wire
          </h2>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            All
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>

        {wire.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">More dispatches are on the way.</p>
        ) : (
          <ol className="mt-1 flex-1 divide-y divide-border">
            {wire.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/articles/${article.slug}`}
                  className="group flex items-center gap-3 py-3"
                >
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-brand-950">
                    {article.featuredImage && (
                      <Image
                        src={article.featuredImage.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      {formatPublishedDate(article.publishedAt)}
                      {article.categories[0] && ` · ${article.categories[0].name}`}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm font-bold leading-snug text-foreground group-hover:text-primary">
                      {article.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </section>
  );
}
