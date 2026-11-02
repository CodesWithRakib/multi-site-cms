import Image from 'next/image';
import Link from 'next/link';
import type { PublicArticleSummary } from '@multi-site-cms/types';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { CategoryBadge } from '@/components/ui/CategoryBadge';

export interface ArticleCardProps {
  article: PublicArticleSummary;
  variant?: 'hero' | 'standard' | 'compact';
  priority?: boolean;
}

export function ArticleCard({ article, variant = 'standard', priority = false }: ArticleCardProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent';

  const category = article.categories[0];
  const categoryLabel = category?.name ?? 'Travel';
  const isGuide = article.type === 'travel_guide';

  if (variant === 'hero') {
    return (
      <article className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-500/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-7 relative aspect-[16/10] lg:aspect-auto min-h-[320px] lg:min-h-[460px] overflow-hidden bg-muted">
            <Image
              src={
                article.featuredImage?.url ??
                'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85'
              }
              alt={article.featuredImage?.altText || article.title}
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute left-4 top-4 z-10">
              <CategoryBadge label={categoryLabel} slug={category?.slug} />
            </div>
            <div className="absolute right-4 top-4 z-10">
              <BookmarkButton articleId={article.id} articleTitle={article.title} />
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div className="space-y-4">
              {isGuide && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <MapPin className="h-3.5 w-3.5" /> Destination Guide
                </span>
              )}

              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                <Link href={`/articles/${article.slug}`}>{article.title}</Link>
              </h2>

              {article.excerpt && (
                <p className="text-muted-foreground text-sm sm:text-base line-clamp-3 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <div className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-border">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt={article.author?.displayName ?? 'Rakib Islam'}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
                <span className="font-semibold text-foreground/80">
                  {article.author?.displayName ?? 'Rakib Islam'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
                  {publishedDate}
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
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
      <article className="group relative flex gap-3.5 items-center rounded-xl p-2 transition hover:bg-muted/50">
        <div className="relative h-18 w-22 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/80">
          <Image
            src={
              article.featuredImage?.url ??
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&q=80'
            }
            alt={article.featuredImage?.altText || article.title}
            fill
            sizes="88px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {categoryLabel}
            </span>
          </div>
          <h4 className="line-clamp-2 text-xs font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={
              article.featuredImage?.url ??
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
            }
            alt={article.featuredImage?.altText || article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 z-10">
            <CategoryBadge label={categoryLabel} slug={category?.slug} />
          </div>
          <div className="absolute right-3 top-3 z-10">
            <BookmarkButton articleId={article.id} articleTitle={article.title} />
          </div>
        </div>

        <div className="p-5 space-y-2.5">
          {isGuide && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <MapPin className="h-3 w-3" /> Field Guide
            </span>
          )}
          <h3 className="line-clamp-2 text-base sm:text-lg font-bold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            <Link href={`/articles/${article.slug}`}>{article.title}</Link>
          </h3>
          {article.excerpt && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span>{publishedDate}</span>
          <span>•</span>
          <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
          <span>{article.readingTimeMinutes} min</span>
        </div>

        <Link
          href={`/articles/${article.slug}`}
          aria-label={`Read article: ${article.title}`}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-foreground transition group-hover:bg-emerald-600 group-hover:text-white"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
