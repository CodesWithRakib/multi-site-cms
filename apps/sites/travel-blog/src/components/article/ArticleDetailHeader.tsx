import Link from 'next/link';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import type { PublicArticleDetail } from '@multi-site-cms/types';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { ShareButtons } from '@/components/interactive/ShareButtons';

interface ArticleDetailHeaderProps {
  article: PublicArticleDetail;
  publishedDate: string;
  articleUrl: string;
}

export function ArticleDetailHeader({
  article,
  publishedDate,
  articleUrl,
}: ArticleDetailHeaderProps) {
  const isGuide = article.type === 'travel_guide';
  const primaryCategory = article.categories[0];

  return (
    <header className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/articles" className="hover:text-emerald-600 transition-colors">
          Blog
        </Link>
        {primaryCategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/categories/${primaryCategory.slug}`}
              className="hover:text-emerald-600 transition-colors"
            >
              {primaryCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="truncate max-w-[200px] text-foreground font-medium">{article.title}</span>
      </nav>

      {/* Category Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {article.categories.map((cat) => (
          <CategoryBadge key={cat.id} label={cat.name} slug={cat.slug} />
        ))}
        {isGuide && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <MapPin className="h-3.5 w-3.5" /> Destination Field Guide
          </span>
        )}
      </div>

      {/* Headline */}
      <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
        {article.title}
      </h1>

      {/* Subtitle / Excerpt */}
      {article.excerpt && (
        <p className="text-base sm:text-xl text-muted-foreground leading-relaxed font-normal">
          {article.excerpt}
        </p>
      )}

      {/* Author & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/80 py-4 text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          {article.author && (
            <>
              <AuthorAvatar
                name={article.author.displayName}
                avatarUrl={article.author.avatarUrl}
                className="size-10 text-sm"
              />
              <span className="font-bold text-foreground">{article.author.displayName}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-5 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {publishedDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            {article.readingTimeMinutes} min read
          </span>
          <div className="flex items-center gap-2 pl-2 border-l border-border/80">
            <BookmarkButton
              articleId={article.id}
              articleSlug={article.slug}
              articleTitle={article.title}
              featuredImageUrl={article.featuredImage?.url}
              categoryName={article.categories[0]?.name}
              readingTimeMinutes={article.readingTimeMinutes}
            />
            <ShareButtons title={article.title} url={articleUrl} />
          </div>
        </div>
      </div>
    </header>
  );
}
