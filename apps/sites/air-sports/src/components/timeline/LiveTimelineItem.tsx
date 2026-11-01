import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Clock, User as UserIcon } from 'lucide-react';
import type { PublicArticleSummary } from '@multi-site-cms/types';

interface LiveTimelineItemProps {
  article: PublicArticleSummary;
  isLatest?: boolean;
}

export function LiveTimelineItem({ article, isLatest }: LiveTimelineItemProps) {
  const publishedDate = new Date(article.publishedAt);
  const timeFormatted = publishedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateFormatted = publishedDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  const isUpdated =
    article.updatedAt && new Date(article.updatedAt).getTime() - publishedDate.getTime() > 180000; // > 3 min difference

  const isBreaking = article.templateKey === 'breaking';

  return (
    <article
      className={`group relative flex gap-4 sm:gap-6 rounded-2xl border transition-all p-4 sm:p-6 ${
        isBreaking
          ? 'border-primary/40 bg-primary/5 shadow-xs'
          : 'border-border bg-card hover:border-foreground/30 shadow-xs'
      }`}
    >
      {/* Telemetry Time Column */}
      <div className="flex flex-col items-center shrink-0">
        <div className="flex flex-col items-center justify-center rounded-xl bg-foreground/5 border border-border px-2.5 py-2 font-mono text-center">
          <Clock className="size-3.5 text-primary mb-1" />
          <time
            dateTime={article.publishedAt}
            className="text-xs font-bold text-foreground tracking-tight"
          >
            {timeFormatted}
          </time>
          <span className="text-[10px] text-muted-foreground uppercase">{dateFormatted}</span>
        </div>

        {isLatest && (
          <span className="mt-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-primary">
            Latest
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {isBreaking && (
            <span className="inline-flex items-center rounded-md bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600">
              Breaking
            </span>
          )}

          {article.categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              #{c.name}
            </Link>
          ))}

          {isUpdated && (
            <span className="text-[10px] font-mono text-amber-600/80 uppercase">Updated</span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          <Link href={`/articles/${article.slug}`} className="flex items-center gap-1.5">
            <span>{article.title}</span>
            <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        </h3>

        {article.excerpt && (
          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {article.featuredImage && (
          <div className="relative mt-3 aspect-[16/9] w-full max-w-md overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-3 border-t border-border/50">
          {article.author && (
            <span className="flex items-center gap-1">
              <UserIcon className="size-3 text-primary" />
              {article.author.displayName}
            </span>
          )}

          <span>{article.readingTimeMinutes} min read</span>

          <Link
            href={`/articles/${article.slug}`}
            className="ml-auto font-sans font-semibold text-primary hover:underline text-xs"
          >
            Full Story →
          </Link>
        </div>
      </div>
    </article>
  );
}
