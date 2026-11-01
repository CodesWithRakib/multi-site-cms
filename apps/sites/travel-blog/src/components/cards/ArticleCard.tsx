import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticleSummary } from '@multi-site-cms/types';
import { Calendar, Clock, MapPin } from 'lucide-react';

export interface ArticleCardProps {
  article: PublicArticleSummary;
  variant?: 'hero' | 'standard' | 'compact';
  priority?: boolean;
}

export function ArticleCard({ article, variant = 'standard', priority = false }: ArticleCardProps) {
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const category = article.categories[0];
  const isGuide = article.type === 'travel_guide';

  if (variant === 'hero') {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[320px] lg:min-h-[460px] overflow-hidden bg-muted">
            {article.featuredImage ? (
              <Image
                src={article.featuredImage.url}
                alt={article.featuredImage.altText || article.title}
                fill
                priority={priority}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/30 to-secondary/60 flex items-center justify-center p-8">
                <MapPin className="h-16 w-16 text-primary/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:hidden" />
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {category && (
                  <Link
                    href={`/categories/${category.slug}`}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
                  >
                    {category.name}
                  </Link>
                )}
                {isGuide && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <MapPin className="h-3 w-3" /> Field Guide
                  </span>
                )}
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                <Link href={`/articles/${article.slug}`}>
                  <span className="absolute inset-0 lg:static" />
                  {article.title}
                </Link>
              </h2>

              {article.excerpt && (
                <p className="font-serif text-muted-foreground text-base sm:text-lg line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {article.author?.displayName && (
                  <span className="font-medium text-foreground">
                    By {article.author.displayName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {publishedDate}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readingTimeMinutes} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group relative flex gap-4 items-center">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
              fill
              sizes="96px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {category && (
            <Link
              href={`/categories/${category.slug}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              {category.name}
            </Link>
          )}
          <h4 className="font-serif text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/articles/${article.slug}`}>
              <span className="absolute inset-0" />
              {article.title}
            </Link>
          </h4>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{publishedDate}</span>
            <span>•</span>
            <span>{article.readingTimeMinutes}m read</span>
          </div>
        </div>
      </article>
    );
  }

  // Standard Grid Card
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/40 hover:-translate-y-1">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {article.featuredImage ? (
          <Image
            src={article.featuredImage.url}
            alt={article.featuredImage.altText || article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/40 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-primary/30" />
          </div>
        )}
        {category && (
          <div className="absolute top-3 left-3">
            <Link
              href={`/categories/${category.slug}`}
              className="relative z-10 inline-flex items-center rounded-full bg-background/90 backdrop-blur-xs px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-background transition-colors"
            >
              {category.name}
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
        <div className="space-y-2">
          {isGuide && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              <MapPin className="h-3 w-3" /> Destination Guide
            </span>
          )}
          <h3 className="font-serif text-xl font-bold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            <Link href={`/articles/${article.slug}`}>
              <span className="absolute inset-0" />
              {article.title}
            </Link>
          </h3>
          {article.excerpt && (
            <p className="font-serif text-muted-foreground text-sm line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{publishedDate}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readingTimeMinutes} min
          </span>
        </div>
      </div>
    </article>
  );
}
