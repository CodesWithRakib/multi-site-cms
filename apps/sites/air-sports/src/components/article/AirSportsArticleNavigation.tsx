import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag as TagIcon, Zap } from 'lucide-react';
import type { PublicArticleDetail } from '@multi-site-cms/types';
import { AirSportsCard } from '@/components/cards/AirSportsCard';

interface AirSportsArticleNavigationProps {
  post: PublicArticleDetail;
}

export function AirSportsArticleNavigation({ post }: AirSportsArticleNavigationProps) {
  return (
    <>
      {/* Tags Bar */}
      {post.tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-2">
          <TagIcon className="size-3.5 text-primary mr-1" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tags:
          </span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground hover:border-primary hover:text-primary transition-colors shadow-xs"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Adjacent Navigation (Prev / Next) */}
      {(post.adjacentArticles.prev || post.adjacentArticles.next) && (
        <nav
          aria-label="Adjacent articles"
          className="mt-12 pt-8 border-t border-border grid sm:grid-cols-2 gap-4"
        >
          {post.adjacentArticles.prev ? (
            <Link
              href={`/articles/${post.adjacentArticles.prev.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors shadow-xs"
            >
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <ChevronLeft className="size-3.5 text-primary" />
                Previous Dispatch
              </span>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {post.adjacentArticles.prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {post.adjacentArticles.next && (
            <Link
              href={`/articles/${post.adjacentArticles.next.slug}`}
              className="group flex flex-col items-end text-right rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors shadow-xs"
            >
              <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Next Dispatch
                <ChevronRight className="size-3.5 text-primary" />
              </span>
              <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {post.adjacentArticles.next.title}
              </span>
            </Link>
          )}
        </nav>
      )}

      {/* Related Coverage */}
      {post.relatedArticles.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16 pt-10 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="size-4 text-primary" />
            <h2
              id="related-heading"
              className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
            >
              Related Coverage
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {post.relatedArticles.map((rel) => (
              <AirSportsCard key={rel.id} article={rel} variant="standard" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

