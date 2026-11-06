import Image from 'next/image';
import Link from 'next/link';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { formatPublishedDate } from '@/lib/format';

interface KeepReadingProps {
  readonly articles: readonly PublicArticleSummary[];
}

/** Compact numbered list of further stories: dense, scannable, no dead space. */
export function KeepReading({ articles }: KeepReadingProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="keep-reading-heading" className="space-y-5">
      <h2
        id="keep-reading-heading"
        className="border-b border-border pb-4 font-serif text-3xl font-bold tracking-tight text-foreground"
      >
        Keep reading
      </h2>
      <ol className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, index) => (
          <li key={article.id}>
            <Link
              href={`/articles/${article.slug}`}
              className="group flex items-center gap-4 rounded-2xl p-2 -mx-2 transition-colors duration-200 hover:bg-muted"
            >
              <span
                aria-hidden="true"
                className="w-6 shrink-0 font-serif text-2xl font-bold text-primary/50"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                {article.categories[0] && (
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                    {article.categories[0].name}
                  </span>
                )}
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                  {article.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {formatPublishedDate(article.publishedAt)} · {article.readingTimeMinutes} min
                </span>
              </span>
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
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
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
