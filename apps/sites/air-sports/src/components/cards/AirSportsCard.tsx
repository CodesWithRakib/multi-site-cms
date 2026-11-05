import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock, User as UserIcon } from 'lucide-react';
import type { PublicArticleSummary } from '@multi-site-cms/types';

interface AirSportsCardProps {
  article: PublicArticleSummary;
  variant?: 'hero' | 'standard' | 'compact';
  priority?: boolean;
}

export function AirSportsCard({
  article,
  variant = 'standard',
  priority = false,
}: AirSportsCardProps) {
  const publishedDate = new Date(article.publishedAt);
  const formattedDate = publishedDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isBreaking = article.templateKey === 'breaking';

  if (variant === 'hero') {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg hover:border-foreground/30 transition-all">
        <div className="grid lg:grid-cols-12 gap-0">
          <div className="relative min-h-[300px] lg:min-h-[440px] lg:col-span-7 bg-muted overflow-hidden">
            {article.featuredImage ? (
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.altText || article.title}
                fill
                priority={priority}
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="size-full flex items-center justify-center bg-stone-900 text-stone-400 font-mono text-sm">
                Air Sports Dispatch
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
          </div>

          <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 lg:col-span-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isBreaking ? (
                  <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
                    Breaking Story
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 border border-primary/25 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                    Featured Dispatch
                  </span>
                )}

                {article.categories[0] && (
                  <Link
                    href={`/categories/${article.categories[0].slug}`}
                    className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    #{article.categories[0].name}
                  </Link>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-[1.05]">
                <Link href={`/articles/${article.slug}`}>{article.title}</Link>
              </h2>

              {article.excerpt && (
                <p className="mt-4 text-base text-foreground/80 leading-relaxed line-clamp-4">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs font-mono text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-primary" />
                <span>{formattedDate}</span>
                <span>·</span>
                <span>{article.readingTimeMinutes} min read</span>
              </div>

              <Link
                href={`/articles/${article.slug}`}
                className="inline-flex items-center gap-1 font-sans font-bold text-primary group-hover:translate-x-1 transition-transform"
              >
                Read Coverage
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group flex items-start gap-4 p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/30 transition-all">
        {article.featuredImage && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted border border-border">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="80px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1">
            <span>{formattedDate}</span>
            {isBreaking && <span className="text-rose-600 font-bold uppercase">Breaking</span>}
          </div>

          <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
          </h4>
        </div>
      </article>
    );
  }

  // Standard Variant
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:border-foreground/30 hover:shadow-md transition-all">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
              fill
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-stone-900 text-stone-400 font-mono text-xs uppercase">
              Aviation Report
            </div>
          )}

          {isBreaking && (
            <span className="absolute top-3 left-3 rounded-full bg-rose-600 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
              Breaking
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-mono text-muted-foreground">
            {article.categories[0] && (
              <Link
                href={`/categories/${article.categories[0].slug}`}
                className="text-primary font-bold hover:underline"
              >
                {article.categories[0].name}
              </Link>
            )}
            <span>·</span>
            <span>{formattedDate}</span>
          </div>

          <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
          </h3>

          {article.excerpt && (
            <p className="mt-2 text-xs text-foreground/80 leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 pt-0 border-t border-border/50 flex items-center justify-between text-xs font-mono text-muted-foreground mt-4">
        {article.author && (
          <span className="flex items-center gap-1">
            <UserIcon className="size-3 text-primary" />
            {article.author.displayName}
          </span>
        )}

        <Link
          href={`/articles/${article.slug}`}
          className="ml-auto font-sans font-semibold text-primary hover:underline text-xs"
        >
          Read Report →
        </Link>
      </div>
    </article>
  );
}
