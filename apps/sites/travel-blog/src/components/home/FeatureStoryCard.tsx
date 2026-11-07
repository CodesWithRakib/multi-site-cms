import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { formatPublishedDate } from '@/lib/format';

interface FeatureStoryCardProps {
  readonly article: PublicArticleSummary;
  /** Load the cover eagerly; set for stories above the fold. */
  readonly priority?: boolean;
}

/**
 * Large story tile: the cover fills the card and the text sits on a gradient at
 * the bottom, so the headline reads on any photo. The title link covers the
 * whole card.
 */
export function FeatureStoryCard({ article, priority = false }: FeatureStoryCardProps) {
  const category = article.categories[0];

  return (
    <article className="group relative isolate flex min-h-80 overflow-hidden rounded-3xl bg-muted shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl sm:min-h-96">
      <div className="absolute inset-0 -z-10">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || ''}
            fill
            preload={priority}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.05]"
          />
        ) : (
          <StoryPlaceholder seed={article.slug} />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/5"
        />
      </div>

      <span className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors duration-200 group-hover:bg-white group-hover:text-foreground">
        <ArrowUpRight aria-hidden="true" className="size-5" />
      </span>

      <div className="mt-auto flex w-full flex-col gap-3 p-5 text-white sm:p-7">
        {category && (
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
            {category.name}
          </span>
        )}
        <h3 className="font-serif text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
          <Link
            href={`/articles/${article.slug}`}
            className="after:absolute after:inset-0 after:z-10"
          >
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
            {article.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/80">
          {article.author && (
            <span className="inline-flex items-center gap-2">
              <AuthorAvatar
                name={article.author.displayName}
                avatarUrl={article.author.avatarUrl}
                className="size-6 bg-white/20 text-[10px] text-white ring-white/30"
              />
              <span className="font-semibold text-white">{article.author.displayName}</span>
            </span>
          )}
          <span>{formatPublishedDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTimeMinutes} min read
          </span>
        </div>
      </div>
    </article>
  );
}
