import Link from 'next/link';

import { ArticleCard } from '@/components/cards/ArticleCard';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PublicArticle } from '@/lib/api';
import { BROWSE_PATH, isFiltered, type BrowseState } from '@/lib/browse-params';

interface PortalArticleGridProps {
  readonly articles: PublicArticle[];
  readonly query: BrowseState;
}

/** Story list: rows on phones, two-column cards from `md`. */
export function PortalArticleGrid({ articles, query }: PortalArticleGridProps) {
  if (articles.length === 0) {
    const filtered = isFiltered(query);
    return (
      <EmptyState
        art={query.q ? 'no-results' : 'no-stories'}
        title={
          query.q
            ? 'Nothing matches your search'
            : filtered
              ? 'No stories here yet'
              : 'No stories yet'
        }
        description={
          filtered
            ? 'Try a shorter word or another topic, or clear the filters.'
            : 'New stories will appear here as soon as they are published.'
        }
        actions={
          filtered ? (
            <Link
              href={BROWSE_PATH}
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
        <ArticleCard key={article.id} article={article} priority={index < 2} highlight={query.q} />
      ))}
    </div>
  );
}
