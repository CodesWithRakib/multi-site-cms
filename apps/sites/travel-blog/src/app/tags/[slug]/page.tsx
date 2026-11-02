import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Tag as TagIcon } from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchTags } from '@/lib/api';

export const revalidate = 60;

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
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
      canonical: `/tags/${tag.slug}`,
    },
  };
}

export default async function TagDetailPage({ params }: TagPageProps) {
  const { slug } = await params;
  const [tags, articlesData] = await Promise.all([
    fetchTags(),
    fetchArticles({ tagSlug: slug, limit: 24 }),
  ]);

  const tag = tags.find((t) => t.slug === slug);

  if (!tag) {
    notFound();
  }

  const articles = articlesData.items;

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

      <header className="border-b border-border/60 pb-8 space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <TagIcon className="h-3.5 w-3.5" /> Tag Archive
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          #{tag.name}
        </h1>
        {tag.description && (
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {tag.description}
          </p>
        )}
      </header>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant="standard"
              priority={idx === 0}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center space-y-2">
          <h2 className="font-serif text-xl font-bold text-foreground">No Articles Tagged #{tag.name}</h2>
          <p className="text-sm text-muted-foreground">Check back soon for new dispatches.</p>
        </div>
      )}

      <div className="pt-8">
        <NewsletterBanner />
      </div>
    </div>
  );
}
