import Link from 'next/link';

import type { PublicArticle } from '@/lib/api';

import { ArticleCard } from '@/components/cards/ArticleCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface PortalArticleGridProps {
  readonly articles: PublicArticle[];
  /** True when a topic filter is active, so the empty message can say so. */
  readonly filtered?: boolean;
}

/** Story list for the portal: rows on phones, two-column cards from `md`. */
export function PortalArticleGrid({ articles, filtered = false }: PortalArticleGridProps) {
  if (articles.length === 0) {
    return (
      <EmptyState
        art="no-stories"
        title={filtered ? 'No stories in this topic yet' : 'No stories yet'}
        description={
          filtered
            ? 'Try another topic, or browse everything we have published.'
            : 'New stories will appear here as soon as they are published.'
        }
        actions={
          filtered ? (
            <Link
              href="/articles"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Show all stories
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} priority={index < 2} />
      ))}
    </div>
  );
}
