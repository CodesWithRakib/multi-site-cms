import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';
import { formatPublishedDate } from '@/lib/format';

/** Small story row: thumbnail, topic, title and date. The whole row is one link. */
export function CompactStoryRow({ article }: { readonly article: PublicArticleSummary }) {
  const category = article.categories[0];

  return (
    <article className="group relative flex h-full items-center gap-4 p-4 transition-colors duration-200 hover:bg-muted/60 sm:p-5">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-28 sm:w-32">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || ''}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.07]"
          />
        ) : (
          <StoryPlaceholder seed={article.slug} />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {category && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
            {category.name}
          </p>
        )}
        <h3 className="line-clamp-3 font-serif text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
          <Link
            href={`/articles/${article.slug}`}
            className="after:absolute after:inset-0 after:z-10"
          >
            {article.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span>{formatPublishedDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden="true" className="size-3.5" />
            {article.readingTimeMinutes} min
          </span>
        </p>
      </div>
    </article>
  );
}
