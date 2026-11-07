import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronRight, Tag as TagIcon } from 'lucide-react';
import { PaginationLinks, pageHref, parsePageParam } from '@multi-site-cms/ui';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { sceneFor } from '@/components/illustrations/ScenicArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchTags } from '@/lib/api';

/** Articles per archive page; further pages are `?page=N`. */
const PAGE_SIZE = 24;

export const revalidate = 60;

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const tags = await fetchTags();
  const tag = tags.find((t) => t.slug === slug);

  if (!tag) {
    return {
      title: 'Tag Not Found',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `#${tag.name} Articles — Travel Blog`,
    description:
      tag.description ||
      `Browse travel stories and articles tagged with #${tag.name} on ${siteConfig.name}.`,
    alternates: {
      canonical: pageHref(`/tags/${tag.slug}`, page),
    },
  };
}

export default async function TagDetailPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const [tags, articlesData] = await Promise.all([
    fetchTags(),
    fetchArticles({ tagSlug: slug, page, limit: PAGE_SIZE }),
  ]);

  const tag = tags.find((t) => t.slug === slug);

  if (!tag) {
    notFound();
  }

  const articles = articlesData.items;
  const totalPages = Math.max(1, articlesData.totalPages);

  // A stale or crafted page past the end goes back to the first page.
  if (page > 1 && articles.length === 0) redirect(`/tags/${slug}`);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-10">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tags" className="hover:text-emerald-600 transition-colors">
          Tags
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">#{tag.name}</span>
      </nav>

      <PageHeader
        eyebrow={
          <>
            <TagIcon aria-hidden="true" className="size-3.5" /> Tag
          </>
        }
        title={`#${tag.name}`}
        description={tag.description || undefined}
        meta={`${articlesData.total} ${articlesData.total === 1 ? 'story' : 'stories'}`}
        scene={sceneFor(tag.slug)}
      />

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, idx) => (
            <ArticleCard key={article.id} article={article} priority={idx < 2} />
          ))}
        </div>
      ) : (
        <EmptyState
          art="no-stories"
          title="No stories with this tag yet"
          description="Stories that use this tag will show up here once they are published."
          actions={
            <Link
              href="/articles"
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Browse all stories
            </Link>
          }
        />
      )}

      <PaginationLinks
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => pageHref(`/tags/${slug}`, target)}
        linkComponent={Link}
        label="Tag pages"
      />

      <div className="pt-8">
        <NewsletterBanner />
      </div>
    </div>
  );
}
