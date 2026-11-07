import type { PublicArticleAuthor, PublicArticleSummary } from '@multi-site-cms/types';

export interface AuthorSummary extends PublicArticleAuthor {
  readonly storyCount: number;
}

/**
 * Distinct authors of the given stories with how many each wrote, most
 * prolific first. Built only from published CMS data, never a hardcoded bio.
 */
export function collectAuthors(articles: readonly PublicArticleSummary[]): AuthorSummary[] {
  const byId = new Map<string, AuthorSummary>();

  for (const article of articles) {
    const author = article.author;
    if (!author) continue;
    const existing = byId.get(author.id);
    byId.set(author.id, { ...author, storyCount: (existing?.storyCount ?? 0) + 1 });
  }

  return [...byId.values()].sort(
    (a, b) => b.storyCount - a.storyCount || a.displayName.localeCompare(b.displayName),
  );
}
