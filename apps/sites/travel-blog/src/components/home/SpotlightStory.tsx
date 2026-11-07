import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { formatPublishedDate } from '@/lib/format';

interface SpotlightStoryProps {
  readonly article: PublicArticleSummary | null;
}

/** One story with a large cover and its excerpt: a pause between the denser grids. */
export function SpotlightStory({ article }: SpotlightStoryProps) {
  if (!article) return null;
  const category = article.categories[0];

  return (
    <section aria-labelledby="spotlight-heading">
      <article className="group relative grid overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl lg:grid-cols-12">
        <div className="relative aspect-16/10 overflow-hidden bg-muted lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || ''}
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <StoryPlaceholder seed={article.slug} />
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:col-span-5 lg:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            In the spotlight{category ? ` · ${category.name}` : ''}
          </p>
          <h2
            id="spotlight-heading"
            className="font-serif text-2xl font-bold leading-tight tracking-tight text-balance text-foreground sm:text-4xl"
          >
            <Link
              href={`/articles/${article.slug}`}
              className="after:absolute after:inset-0 after:z-10"
            >
              {article.title}
            </Link>
          </h2>
          {article.excerpt && (
            <p className="line-clamp-4 text-base leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {article.author && (
              <span className="inline-flex items-center gap-2">
                <AuthorAvatar
                  name={article.author.displayName}
                  avatarUrl={article.author.avatarUrl}
                  className="size-8 text-xs"
                />
                <span className="font-semibold text-foreground">{article.author.displayName}</span>
              </span>
            )}
            <span>{formatPublishedDate(article.publishedAt)}</span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="size-4" />
              {article.readingTimeMinutes} min read
            </span>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-bold text-primary">
            Read the story
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
        </div>
      </article>
    </section>
  );
}
