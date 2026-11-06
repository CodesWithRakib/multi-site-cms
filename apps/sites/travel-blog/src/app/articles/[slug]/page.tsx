import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { documentOutline } from '@multi-site-cms/config/doc-outline';
import { ArticleAuthorCard } from '@/components/article/ArticleAuthorCard';
import { ArticleDetailHeader } from '@/components/article/ArticleDetailHeader';
import { ArticleHeroImage } from '@/components/article/ArticleHeroImage';
import { ArticleNavigationAndRelated } from '@/components/article/ArticleNavigationAndRelated';
import { ArticleTableOfContents } from '@/components/article/ArticleTableOfContents';
import { ArticleCommentsSection } from '@/components/article/comments/ArticleCommentsSection';
import { DocRenderer } from '@/components/content/DocRenderer';
import { siteConfig } from '@/config/site';
import { fetchArticleBySlug } from '@/lib/api';
import { fetchArticleComments } from '@/lib/comments';

export const revalidate = 60; // ISR cache revalidation every 60s

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || siteConfig.description;
  const canonical = article.canonicalUrl || `/articles/${article.slug}`;
  const imageUrl = article.featuredImage?.url;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      url: `/articles/${article.slug}`,
      title,
      description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author?.displayName ? [article.author.displayName] : undefined,
      tags: article.tags.map((t) => t.name),
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: article.featuredImage?.altText || title,
              width: article.featuredImage?.width || 1200,
              height: article.featuredImage?.height || 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, initialComments] = await Promise.all([
    fetchArticleBySlug(slug),
    fetchArticleComments(slug),
  ]);

  if (!article) {
    notFound();
  }

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isGuide = article.type === 'travel_guide';
  const outline = documentOutline(article.body);
  const hasOutline = outline.length >= 2;
  const articleUrl = `${siteConfig.url}/articles/${article.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isGuide ? 'Guide' : 'BlogPosting',
        '@id': `${articleUrl}/#article`,
        headline: article.title,
        description: article.excerpt || article.seoDescription,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        mainEntityOfPage: articleUrl,
        image: article.featuredImage?.url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-14 space-y-10">
        {/* Header with Title, Breadcrumbs, Category Badges, Bookmark & Share */}
        <ArticleDetailHeader
          article={article}
          publishedDate={publishedDate}
          articleUrl={articleUrl}
        />

        {/* Panoramic Featured Hero Image */}
        <ArticleHeroImage featuredImage={article.featuredImage} title={article.title} />

        <div
          className={
            hasOutline
              ? 'grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] xl:gap-14'
              : 'mx-auto max-w-4xl'
          }
        >
          <div className="min-w-0 space-y-10">
            {/* On small screens the outline sits above the text, collapsed. */}
            {hasOutline && (
              <details className="rounded-2xl border border-border/80 bg-card p-4 lg:hidden">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  On this page <span className="text-muted-foreground">({outline.length})</span>
                </summary>
                <ArticleTableOfContents entries={outline} className="mt-4" />
              </details>
            )}

            {/* Rich Document Content */}
            <div className="prose prose-emerald dark:prose-invert max-w-none font-serif text-foreground/90 leading-relaxed [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24">
              <DocRenderer document={article.body} />
            </div>

            {/* Author Bio Box */}
            <ArticleAuthorCard author={article.author} />

            {/* Reader Comments & Interactive Reviews Section */}
            <ArticleCommentsSection slug={article.slug} initialData={initialComments} />
          </div>

          {hasOutline && (
            <aside className="hidden lg:block">
              <ArticleTableOfContents entries={outline} className="sticky top-24" />
            </aside>
          )}
        </div>

        {/* Tags, Adjacent Stories, Related Dispatches & Newsletter */}
        <ArticleNavigationAndRelated
          tags={article.tags}
          adjacentArticles={article.adjacentArticles}
          relatedArticles={article.relatedArticles}
        />
      </article>
    </>
  );
}
