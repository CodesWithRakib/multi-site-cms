import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { documentOutline } from '@multi-site-cms/config/doc-outline';

import { DocRenderer } from '@/components/content/DocRenderer';
import { AirSportsArticleHeader } from '@/components/article/AirSportsArticleHeader';
import { AirSportsArticleNavigation } from '@/components/article/AirSportsArticleNavigation';
import { AirSportsTableOfContents } from '@/components/article/AirSportsTableOfContents';
import { siteConfig } from '@/config/site';
import { fetchArticleBySlug } from '@/lib/api';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchArticleBySlug(slug);

  if (!post) {
    return {
      title: 'Dispatch Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || siteConfig.description;
  const canonical = post.canonicalUrl || `${siteConfig.url}/articles/${post.slug}`;
  const ogImage = post.featuredImage?.url || `${siteConfig.url}/images/air-sports-og.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'article',
      url: `/articles/${post.slug}`,
      siteName: siteConfig.name,
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.displayName] : undefined,
      images: [
        {
          url: ogImage,
          width: post.featuredImage?.width || 1200,
          height: post.featuredImage?.height || 630,
          alt: post.featuredImage?.altText || title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = await fetchArticleBySlug(slug);

  if (!post) {
    notFound();
  }

  const publishedDate = new Date(post.publishedAt);
  const formattedDate = publishedDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = publishedDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isBreaking = post.templateKey === 'breaking';
  const outline = documentOutline(post.body);
  const hasOutline = outline.length >= 2;

  // Structured Data (JSON-LD)
  const isNews = post.type === 'news' || isBreaking;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': isNews ? 'NewsArticle' : 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author
      ? {
          '@type': 'Person',
          name: post.author.displayName,
        }
      : {
          '@type': 'Organization',
          name: siteConfig.name,
        },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/images/air-sports-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/articles/${post.slug}`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.categories[0]?.name || 'Dispatches',
        item: post.categories[0]
          ? `${siteConfig.url}/categories/${post.categories[0].slug}`
          : `${siteConfig.url}/categories`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteConfig.url}/articles/${post.slug}`,
      },
    ],
  };

  return (
    <article className="min-h-screen py-8 sm:py-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div
        className={
          hasOutline
            ? 'mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-8 xl:gap-14'
            : 'mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'
        }
      >
        <div className="min-w-0">
          <AirSportsArticleHeader
            post={post}
            isBreaking={isBreaking}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
          />

          {/* Hero Featured Media */}
          {post.featuredImage && (
            <figure className="my-8 overflow-hidden rounded-3xl border border-border bg-muted shadow-md">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.altText || post.title}
                  fill
                  preload
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 896px"
                />
              </div>
              {(post.featuredImage.caption || post.featuredImage.altText) && (
                <figcaption className="p-3 text-center text-xs font-mono text-muted-foreground border-t border-border/40">
                  {post.featuredImage.caption || post.featuredImage.altText}
                </figcaption>
              )}
            </figure>
          )}

          {/* On small screens the outline sits above the text, collapsed. */}
          {hasOutline && (
            <details className="rounded-2xl border border-border bg-card p-4 lg:hidden">
              <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                On this page <span className="text-muted-foreground">({outline.length})</span>
              </summary>
              <AirSportsTableOfContents entries={outline} className="mt-4" />
            </details>
          )}

          {/* Safe Document Body AST Rendering */}
          <div className="my-8 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24">
            <DocRenderer document={post.body} />
          </div>

          <AirSportsArticleNavigation post={post} />
        </div>

        {hasOutline && (
          <aside className="hidden lg:block">
            <AirSportsTableOfContents entries={outline} className="sticky top-24" />
          </aside>
        )}
      </div>
    </article>
  );
}
