import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleAuthorCard } from '@/components/article/ArticleAuthorCard';
import { ArticleDetailHeader } from '@/components/article/ArticleDetailHeader';
import { ArticleHeroImage } from '@/components/article/ArticleHeroImage';
import { ArticleNavigationAndRelated } from '@/components/article/ArticleNavigationAndRelated';
import { DocRenderer } from '@/components/content/DocRenderer';
import { siteConfig } from '@/config/site';
import { fetchArticleBySlug } from '@/lib/api';

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
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isGuide = article.type === 'travel_guide';
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

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-14 space-y-10">
        {/* Header with Title, Breadcrumbs, Category Badges, Bookmark & Share */}
        <ArticleDetailHeader
          article={article}
          publishedDate={publishedDate}
          articleUrl={articleUrl}
        />

        {/* Panoramic Featured Hero Image */}
        <ArticleHeroImage featuredImage={article.featuredImage} title={article.title} />

        {/* Rich Document Content */}
        <div className="prose prose-emerald dark:prose-invert max-w-none font-serif text-foreground/90 leading-relaxed">
          <DocRenderer document={article.body} />
        </div>

        {/* Author Bio Box */}
        <ArticleAuthorCard author={article.author} />

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
