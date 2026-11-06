'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Clock } from 'lucide-react';
import type { PublicArticle } from '@/lib/api';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

interface PortalArticleGridProps {
  articles: PublicArticle[];
}

export function PortalArticleGrid({ articles }: PortalArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-2">
        <p className="font-semibold text-foreground">No articles found in this category.</p>
        <p className="text-xs text-muted-foreground">
          Select another filter or browse all categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      {articles.map((article) => {
        const primaryCategory = article.categories?.[0];
        const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        return (
          <article
            key={article.id}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              {/* Media Container with Category Overlay */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-muted">
                {article.featuredImage ? (
                  <Image
                    src={article.featuredImage.url}
                    alt={article.featuredImage.altText ?? article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="size-full bg-linear-to-br from-brand-700 via-brand-900 to-brand-950"
                  />
                )}

                {/* Overlays */}
                {primaryCategory && (
                  <div className="absolute left-3 top-3 z-10">
                    <CategoryBadge label={primaryCategory.name} slug={primaryCategory.slug} />
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="p-4 sm:p-5 space-y-3">
                <h3 className="line-clamp-2 text-base font-bold text-foreground transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </h3>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {formattedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {article.readingTimeMinutes} min read
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Author Row & Action Button */}
            <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
              {/* Real author from the CMS: their uploaded photo, else initials. */}
              {article.author ? (
                <div className="flex items-center gap-2.5">
                  <AuthorAvatar
                    name={article.author.displayName}
                    avatarUrl={article.author.avatarUrl}
                    className="size-7 text-[10px]"
                  />
                  <span className="text-xs font-semibold text-foreground/80">
                    {article.author.displayName}
                  </span>
                </div>
              ) : (
                <span />
              )}

              <Link
                href={`/articles/${article.slug}`}
                aria-label={`Read ${article.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-foreground transition-colors group-hover:bg-emerald-600 group-hover:text-white"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
