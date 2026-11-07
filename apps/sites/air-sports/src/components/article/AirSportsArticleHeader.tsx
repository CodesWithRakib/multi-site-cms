import React from 'react';
import Link from 'next/link';
import { Calendar, Clock } from 'lucide-react';
import type { PublicArticleDetail } from '@multi-site-cms/types';
import { ShareButtons } from '@/components/interactive/ShareButtons';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { siteConfig } from '@/config/site';

interface AirSportsArticleHeaderProps {
  post: PublicArticleDetail;
  isBreaking: boolean;
  formattedDate: string;
  formattedTime: string;
}

export function AirSportsArticleHeader({
  post,
  isBreaking,
  formattedDate,
  formattedTime,
}: AirSportsArticleHeaderProps) {
  return (
    <header className="mb-8">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
      >
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        {post.categories[0] ? (
          <Link
            href={`/categories/${post.categories[0].slug}`}
            className="hover:text-primary transition-colors"
          >
            {post.categories[0].name}
          </Link>
        ) : (
          <Link href="/categories" className="hover:text-primary transition-colors">
            Dispatches
          </Link>
        )}
        <span>/</span>
        <span aria-current="page" className="text-foreground truncate max-w-[200px] sm:max-w-xs">
          {post.title}
        </span>
      </nav>

      {/* Header Tags & Metadata */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        {isBreaking && (
          <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
            Breaking Alert
          </span>
        )}

        {post.categories.map((c) => (
          <Link
            key={c.id}
            href={`/categories/${c.slug}`}
            className="rounded-full border border-border bg-card px-3 py-2 font-mono text-xs font-semibold text-muted-foreground hover:text-primary transition-colors shadow-xs"
          >
            #{c.name}
          </Link>
        ))}

        {post.event && (
          <Link
            href={`/events/${post.event.slug}`}
            className="touch-target rounded-full bg-primary/10 border border-primary/25 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
          >
            Hub: {post.event.name}
          </Link>
        )}
      </div>

      {/* Article Headline */}
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
        {post.title}
      </h1>

      {/* Lead Excerpt */}
      {post.excerpt && (
        <p className="mt-4 text-lg sm:text-xl text-foreground/85 leading-relaxed font-sans border-l-2 border-primary/40 pl-4 py-1">
          {post.excerpt}
        </p>
      )}

      {/* Author & Telemetry Timestamp Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-3.5 text-xs font-mono text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          {post.author && (
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <AuthorAvatar
                name={post.author.displayName}
                avatarUrl={post.author.avatarUrl}
                className="size-7 font-sans text-[10px]"
              />
              {post.author.displayName}
            </span>
          )}

          <span className="flex items-center gap-1">
            <Calendar className="size-3.5 text-primary" />
            <time dateTime={post.publishedAt}>
              {formattedDate} at {formattedTime}
            </time>
          </span>

          <span className="flex items-center gap-1">
            <Clock className="size-3.5 text-primary" />
            {post.readingTimeMinutes} min read
          </span>
        </div>

        <ShareButtons title={post.title} url={`${siteConfig.url}/articles/${post.slug}`} />
      </div>
    </header>
  );
}
