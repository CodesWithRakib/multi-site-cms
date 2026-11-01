import React from 'react';
import Link from 'next/link';
import { ChevronRight, Flame } from 'lucide-react';
import type { PublicArticleSummary } from '@multi-site-cms/types';

interface BreakingNewsBannerProps {
  breakingArticles: PublicArticleSummary[];
}

export function BreakingNewsBanner({ breakingArticles }: BreakingNewsBannerProps) {
  if (!breakingArticles || breakingArticles.length === 0) {
    return null;
  }

  // Primary breaking news headline
  const primary = breakingArticles[0];
  if (!primary) return null;

  return (
    <aside
      aria-label="Breaking news alert"
      className="border-b border-primary/30 bg-primary/10 text-foreground transition-colors"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
            <Flame className="size-3.5 animate-pulse" />
            Breaking News
          </span>

          <Link
            href={`/articles/${primary.slug}`}
            className="group flex min-w-0 items-center gap-2 text-sm font-semibold hover:text-primary transition-colors truncate"
          >
            <span className="truncate">{primary.title}</span>
            <span className="hidden font-mono text-xs text-muted-foreground sm:inline shrink-0">
              {new Date(primary.publishedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <ChevronRight className="size-4 shrink-0 text-primary group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {breakingArticles.length > 1 && (
          <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>
              +{breakingArticles.length - 1} more alert{breakingArticles.length > 2 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
