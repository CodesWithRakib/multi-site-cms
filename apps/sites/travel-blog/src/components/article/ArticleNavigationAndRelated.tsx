import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PublicArticleDetail } from '@multi-site-cms/types';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';

interface ArticleNavigationAndRelatedProps {
  tags: PublicArticleDetail['tags'];
  adjacentArticles: PublicArticleDetail['adjacentArticles'];
  relatedArticles: PublicArticleDetail['relatedArticles'];
}

export function ArticleNavigationAndRelated({
  tags,
  adjacentArticles,
  relatedArticles,
}: ArticleNavigationAndRelatedProps) {
  return (
    <div className="space-y-12 pt-6">
      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="border-t border-border pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Filed under
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Adjacent Articles Navigation */}
      {(adjacentArticles.prev || adjacentArticles.next) && (
        <nav
          aria-label="Adjacent articles"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-6"
        >
          {adjacentArticles.prev ? (
            <Link
              href={`/articles/${adjacentArticles.prev.slug}`}
              className="group rounded-2xl border border-border bg-card p-4 hover:border-emerald-500/40 transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-emerald-500" />{' '}
                Previous Story
              </span>
              <span className="font-serif text-sm font-bold text-foreground line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {adjacentArticles.prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}

          {adjacentArticles.next ? (
            <Link
              href={`/articles/${adjacentArticles.next.slug}`}
              className="group rounded-2xl border border-border bg-card p-4 text-right hover:border-emerald-500/40 transition-colors shadow-2xs"
            >
              <span className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Next Story{' '}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-emerald-500" />
              </span>
              <span className="font-serif text-sm font-bold text-foreground line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {adjacentArticles.next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}

      {/* Related Articles Showcase */}
      {relatedArticles.length > 0 && (
        <section
          aria-labelledby="related-articles-heading"
          className="border-t border-border pt-10 space-y-6"
        >
          <div className="border-l-4 border-emerald-500 pl-3">
            <h3
              id="related-articles-heading"
              className="font-serif text-2xl font-bold text-foreground"
            >
              Related Dispatches
            </h3>
            <p className="text-xs text-muted-foreground">
              Continue exploring stories curated along similar routes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <ArticleCard key={rel.id} article={rel} variant="standard" />
            ))}
          </div>
        </section>
      )}

      {/* Inline Newsletter Banner */}
      <div className="pt-4">
        <NewsletterBanner />
      </div>
    </div>
  );
}
