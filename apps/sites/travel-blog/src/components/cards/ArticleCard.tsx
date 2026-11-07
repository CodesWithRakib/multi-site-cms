import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { formatPublishedDate } from '@/lib/format';

export interface ArticleCardProps {
  readonly article: PublicArticleSummary;
  /** Load the cover eagerly; set for the first card above the fold. */
  readonly priority?: boolean;
}

function Cover({
  article,
  sizes,
  priority,
}: {
  readonly article: PublicArticleSummary;
  readonly sizes: string;
  readonly priority: boolean;
}) {
  if (!article.featuredImage) return <StoryPlaceholder seed={article.slug} />;
  return (
    <Image
      src={article.featuredImage.url}
      alt={article.featuredImage.altText || ''}
      fill
      preload={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
    />
  );
}

/**
 * One story in a list. On phones it is a compact row (thumbnail beside the
 * title) so many stories are visible at once; from `sm` up it is a card with
 * the excerpt and byline. The whole card is one link (the title's stretched
 * link), with the topic badge lifted above it as its own link.
 */
export function ArticleCard({ article, priority = false }: ArticleCardProps) {
  const category = article.categories[0];
  const isGuide = article.type === 'travel_guide';
  const href = `/articles/${article.slug}`;

  return (
    <article
      className={cn(
        'group relative flex gap-4 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 transition-[box-shadow,transform,border-color] duration-300',
        'hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5',
        'sm:flex-col sm:gap-0 sm:p-0',
      )}
    >
      <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl bg-muted sm:aspect-16/10 sm:size-auto sm:w-full sm:rounded-none">
        <Cover
          article={article}
          priority={priority}
          sizes="(max-width: 640px) 112px, (max-width: 1200px) 50vw, 33vw"
        />
        {category && (
          <div className="absolute left-3 top-3 z-20 hidden sm:block">
            <CategoryBadge label={category.name} slug={category.slug} variant="overlay" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 sm:justify-start sm:p-5">
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary sm:hidden">
          {category && <span>{category.name}</span>}
          {isGuide && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-3" /> Guide
            </span>
          )}
        </p>
        {isGuide && (
          <p className="hidden items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary sm:inline-flex">
            <MapPin aria-hidden="true" className="size-3" /> Field guide
          </p>
        )}

        <h3 className="line-clamp-3 font-serif text-base font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
          <Link href={href} className="after:absolute after:inset-0 after:z-10">
            {article.title}
          </Link>
        </h3>

        {article.excerpt && (
          <p className="hidden line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:block">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground sm:pt-3">
          {article.author && (
            <span className="hidden items-center gap-2 sm:inline-flex">
              <AuthorAvatar
                name={article.author.displayName}
                avatarUrl={article.author.avatarUrl}
                className="size-6 text-[10px]"
              />
              <span className="font-semibold text-foreground/80">{article.author.displayName}</span>
            </span>
          )}
          <span>{formatPublishedDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTimeMinutes} min
          </span>
          <span className="ml-auto hidden items-center gap-1 font-semibold text-primary sm:inline-flex">
            Read story
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </article>
  );
}
