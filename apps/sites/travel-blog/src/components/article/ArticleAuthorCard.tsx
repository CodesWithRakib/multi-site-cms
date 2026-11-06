import type { PublicArticleDetail } from '@multi-site-cms/types';

import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { siteConfig } from '@/config/site';

interface ArticleAuthorCardProps {
  author: PublicArticleDetail['author'];
}

/** Byline card with only what the CMS knows about the author. */
export function ArticleAuthorCard({ author }: ArticleAuthorCardProps) {
  if (!author) return null;

  return (
    <section
      aria-label="About the author"
      className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs sm:p-6"
    >
      <AuthorAvatar
        name={author.displayName}
        avatarUrl={author.avatarUrl}
        className="size-14 text-lg"
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Written by
        </p>
        <p className="text-base font-bold text-foreground sm:text-lg">{author.displayName}</p>
        <p className="text-xs text-muted-foreground">Writes for {siteConfig.name}</p>
      </div>
    </section>
  );
}
