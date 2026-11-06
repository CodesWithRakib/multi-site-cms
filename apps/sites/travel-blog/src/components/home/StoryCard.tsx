import Image from 'next/image';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { formatPublishedDate } from '@/lib/format';

interface StoryCardProps {
  readonly article: PublicArticleSummary;
  /** `feature` spans two grid rows with a taller image and larger title. */
  readonly size?: 'feature' | 'default';
}

/** Editorial story tile: image, topic, title, byline. The whole card links. */
export function StoryCard({ article, size = 'default' }: StoryCardProps) {
  const isFeature = size === 'feature';
  const category = article.categories[0];

  return (
    <article className="group relative flex w-full flex-col">
      <div className={cn('relative overflow-hidden rounded-3xl bg-muted', 'aspect-4/3')}>
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || ''}
            fill
            sizes={isFeature ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 640px) 100vw, 25vw'}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 px-1 pt-4">
        {category && (
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
            {category.name}
          </span>
        )}
        <h3
          className={cn(
            'font-serif font-bold leading-snug tracking-tight text-foreground text-balance',
            isFeature ? 'text-2xl sm:text-3xl' : 'text-lg',
          )}
        >
          <Link
            href={`/articles/${article.slug}`}
            className="after:absolute after:inset-0 after:z-10 group-hover:text-primary"
          >
            {article.title}
          </Link>
        </h3>
        {isFeature && article.excerpt && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {article.author && <span className="font-semibold">{article.author.displayName} · </span>}
          {formatPublishedDate(article.publishedAt)} · {article.readingTimeMinutes} min
        </p>
      </div>
    </article>
  );
}
