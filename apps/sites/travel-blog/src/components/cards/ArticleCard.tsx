import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn, SearchHighlight } from '@multi-site-cms/ui';

import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { formatShortDate } from '@/lib/format';

export interface ArticleCardProps {
  readonly article: PublicArticleSummary;
  /** Load the cover eagerly; set for the first card above the fold. */
  readonly priority?: boolean;
  /** Search text to highlight in the title and excerpt. */
  readonly highlight?: string;
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
      className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
    />
  );
}

/**
 * One story in a list, in two shapes that follow the screen:
 *  - below `md` a compact row (thumbnail beside the text), so many stories fit and
 *    a single wide column never turns into one huge photo;
 *  - from `md` a card with a 16:9 cover and a one-line footer.
 * The whole card is one link (the title's stretched link); the topic badge is
 * lifted above it as its own link.
 */
export function ArticleCard({ article, priority = false, highlight = '' }: ArticleCardProps) {
  const category = article.categories[0];
  const isGuide = article.type === 'travel_guide';
  const href = `/articles/${article.slug}`;

  return (
    <article
      className={cn(
        'group relative flex gap-4 overflow-hidden rounded-3xl border border-border/80 bg-card p-3 transition-[box-shadow,transform,border-color] duration-300',
        'hover:border-primary/40 hover:shadow-lg motion-safe:hover:-translate-y-0.5',
        'md:flex-col md:gap-0 md:p-0',
      )}
    >
      <div className="relative size-28 shrink-0 self-start overflow-hidden rounded-2xl bg-muted sm:size-36 md:aspect-16/9 md:size-auto md:w-full md:self-auto md:rounded-none">
        <Cover
          article={article}
          priority={priority}
          sizes="(max-width: 768px) 144px, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute left-3 top-3 z-20 hidden items-center gap-1.5 md:flex">
          {category && (
            <CategoryBadge label={category.name} slug={category.slug} variant="overlay" />
          )}
          {isGuide && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-xs">
              <MapPin aria-hidden="true" className="size-3" /> Guide
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2 md:p-4">
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary md:hidden">
          {category && <span>{category.name}</span>}
          {isGuide && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" className="size-3" /> Guide
            </span>
          )}
        </p>

        <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-lg md:text-[1.15rem]">
          <Link href={href} className="after:absolute after:inset-0 after:z-10">
            <SearchHighlight text={article.title} query={highlight} />
          </Link>
        </h3>

        {article.excerpt && (
          <p className="hidden line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:block">
            <SearchHighlight text={article.excerpt} query={highlight} />
          </p>
        )}

        {/* One line: who and when on the left, the arrow cue on the right. Long names truncate. */}
        <div className="mt-auto flex items-center gap-2 pt-1 text-xs text-muted-foreground md:pt-2">
          {article.author && (
            <span className="hidden min-w-0 items-center gap-2 md:inline-flex">
              <AuthorAvatar
                name={article.author.displayName}
                avatarUrl={article.author.avatarUrl}
                className="size-6 text-[10px]"
              />
              <span className="truncate font-semibold text-foreground/80">
                {article.author.displayName}
              </span>
            </span>
          )}
          <span className="flex shrink-0 items-center gap-1.5 md:ml-auto">
            <span>{formatShortDate(article.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-3.5" />
              {article.readingTimeMinutes} min
            </span>
          </span>
          <ArrowUpRight
            aria-hidden="true"
            className="hidden size-4 shrink-0 text-primary transition-transform duration-200 md:block motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </article>
  );
}
