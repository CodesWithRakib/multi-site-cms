import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Tag as TagIcon,
  User as UserIcon,
  Zap,
} from 'lucide-react';

import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { DocRenderer } from '@/components/content/DocRenderer';
import { ShareButtons } from '@/components/interactive/ShareButtons';
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

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Radar
          </Link>
          <span>/</span>
          {post.categories[0] ? (
            <Link
              href={`/categories/${post.categories[0].slug}`}
              className="hover:text-primary transition-colors"
            >
              {post.categories[0].name}
            </Link>
          ) : (
            <Link href="/categories" className="hover:text-primary transition-colors">
              Dispatches
            </Link>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px] sm:max-w-xs">{post.slug}</span>
        </nav>

        {/* Header Tags & Metadata */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          {isBreaking && (
            <span className="rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
              Breaking Alert
            </span>
          )}

          {post.categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="rounded-full border border-border bg-card px-3 py-0.5 font-mono text-xs font-semibold text-muted-foreground hover:text-primary transition-colors shadow-xs"
            >
              #{c.name}
            </Link>
          ))}

          {post.event && (
            <Link
              href={`/events/${post.event.slug}`}
              className="rounded-full bg-primary/10 border border-primary/25 px-3 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
            >
              Hub: {post.event.name}
            </Link>
          )}
        </div>

        {/* Article Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground leading-[1.05]">
          {post.title}
        </h1>

        {/* Lead Excerpt */}
        {post.excerpt && (
          <p className="mt-4 text-lg sm:text-xl text-foreground/85 leading-relaxed font-sans border-l-2 border-primary/40 pl-4 py-1">
            {post.excerpt}
          </p>
        )}

        {/* Author & Telemetry Timestamp Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-border py-3.5 text-xs font-mono text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            {post.author && (
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <UserIcon className="size-3.5 text-primary" />
                {post.author.displayName}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-primary" />
              <time dateTime={post.publishedAt}>
                {formattedDate} at {formattedTime}
              </time>
            </span>

            <span className="flex items-center gap-1">
              <Clock className="size-3.5 text-primary" />
              {post.readingTimeMinutes} min read
            </span>
          </div>

          <ShareButtons title={post.title} url={`${siteConfig.url}/articles/${post.slug}`} />
        </div>

        {/* Hero Featured Media */}
        {post.featuredImage && (
          <figure className="my-8 overflow-hidden rounded-3xl border border-border bg-muted shadow-md">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.altText || post.title}
                fill
                priority
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

        {/* Safe Document Body AST Rendering */}
        <div className="my-8">
          <DocRenderer document={post.body} />
        </div>

        {/* Tags Bar */}
        {post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center gap-2">
            <TagIcon className="size-3.5 text-primary mr-1" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Tags:
            </span>
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground hover:border-primary hover:text-primary transition-colors shadow-xs"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Adjacent Navigation (Prev / Next) */}
        {(post.adjacentArticles.prev || post.adjacentArticles.next) && (
          <nav
            aria-label="Adjacent articles"
            className="mt-12 pt-8 border-t border-border grid sm:grid-cols-2 gap-4"
          >
            {post.adjacentArticles.prev ? (
              <Link
                href={`/articles/${post.adjacentArticles.prev.slug}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors shadow-xs"
              >
                <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  <ChevronLeft className="size-3.5 text-primary" />
                  Previous Dispatch
                </span>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.adjacentArticles.prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {post.adjacentArticles.next && (
              <Link
                href={`/articles/${post.adjacentArticles.next.slug}`}
                className="group flex flex-col items-end text-right rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors shadow-xs"
              >
                <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Next Dispatch
                  <ChevronRight className="size-3.5 text-primary" />
                </span>
                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {post.adjacentArticles.next.title}
                </span>
              </Link>
            )}
          </nav>
        )}

        {/* Related Coverage */}
        {post.relatedArticles.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16 pt-10 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="size-4 text-primary" />
              <h2
                id="related-heading"
                className="text-xl font-bold uppercase tracking-tight text-foreground font-mono"
              >
                Related Coverage
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {post.relatedArticles.map((rel) => (
                <AirSportsCard key={rel.id} article={rel} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
