import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, ImageOff } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { formatPublishedDate } from '@/lib/format';

import { SearchHighlight } from './SearchHighlight';

interface SearchResultCardProps {
  readonly article: PublicArticleSummary;
  readonly query: string;
}

/** Result tile: image with topic badge, date + read time, title, excerpt, byline. */
export function SearchResultCard({ article, query }: SearchResultCardProps) {
  const category = article.categories[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-16/10 overflow-hidden bg-muted">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || ''}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-7" />
          </div>
        )}
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur dark:bg-neutral-900/90">
            {category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar aria-hidden="true" className="size-3.5" />
            {formatPublishedDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTimeMinutes} min read
          </span>
        </p>
        <h3 className="text-lg font-bold leading-snug text-foreground text-balance">
          <Link
            href={`/articles/${article.slug}`}
            className="after:absolute after:inset-0 group-hover:text-primary"
          >
            <SearchHighlight text={article.title} query={query} />
          </Link>
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          {article.author ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
              <AuthorAvatar
                name={article.author.displayName}
                avatarUrl={article.author.avatarUrl}
                className="size-7 text-[10px]"
              />
              {article.author.displayName}
            </span>
          ) : (
            <span />
          )}
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
          >
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
