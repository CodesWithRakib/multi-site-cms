import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import { ArticleCard } from '@/components/cards/ArticleCard';
import { DocRenderer } from '@/components/content/DocRenderer';
import { ShareButtons } from '@/components/interactive/ShareButtons';
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

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': isGuide ? 'Guide' : 'BlogPosting',
        '@id': `${articleUrl}/#article`,
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${siteConfig.url}/#website`,
          name: siteConfig.name,
          url: siteConfig.url,
        },
        headline: article.title,
        description: article.excerpt || article.seoDescription,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        mainEntityOfPage: articleUrl,
        author: article.author?.displayName
          ? {
              '@type': 'Person',
              name: article.author.displayName,
            }
          : undefined,
        publisher: {
          '@type': 'Organization',
          name: siteConfig.name,
          url: siteConfig.url,
        },
        image: article.featuredImage?.url,
        keywords: article.tags.map((t) => t.name).join(', '),
        articleSection: article.categories[0]?.name,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteConfig.url,
          },
          ...(article.categories[0]
            ? [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: article.categories[0].name,
                  item: `${siteConfig.url}/categories/${article.categories[0].slug}`,
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: article.title,
                  item: articleUrl,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: article.title,
                  item: articleUrl,
                },
              ]),
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          {article.categories[0] ? (
            <>
              <Link
                href={`/categories/${article.categories[0].slug}`}
                className="hover:text-primary transition-colors"
              >
                {article.categories[0].name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          ) : null}
          <span className="truncate max-w-[200px] text-foreground font-medium">
            {article.title}
          </span>
        </nav>

        {/* Article Header */}
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {article.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            {isGuide && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <MapPin className="h-3.5 w-3.5" /> Destination Field Guide
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="font-serif text-lg sm:text-2xl text-muted-foreground leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border/80 py-4 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted border border-border">
                <UserIcon className="h-4 w-4 text-foreground/70" />
              </div>
              <div>
                <span className="font-medium text-foreground block">
                  {article.author?.displayName || 'Editorial Desk'}
                </span>
                <span className="text-xs text-muted-foreground">Contributing Author</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {publishedDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {article.readingTimeMinutes} min read
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <figure className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-muted border border-border/80 shadow-md">
            <Image
              src={article.featuredImage.url}
              alt={article.featuredImage.altText || article.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
            {article.featuredImage.caption && (
              <figcaption className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-3 text-center text-xs text-white">
                {article.featuredImage.caption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Social Share Bar */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <ShareButtons title={article.title} url={articleUrl} />
        </div>

        {/* Main Document Body */}
        <div className="pt-2">
          <DocRenderer document={article.body} />
        </div>

        {/* Tags Section */}
        {article.tags.length > 0 && (
          <div className="border-t border-border pt-8">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Filed under
            </h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Adjacent Articles */}
        {(article.adjacentArticles.prev || article.adjacentArticles.next) && (
          <nav
            aria-label="Adjacent articles"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-8"
          >
            {article.adjacentArticles.prev ? (
              <Link
                href={`/articles/${article.adjacentArticles.prev.slug}`}
                className="group rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />{' '}
                  Previous Article
                </span>
                <span className="font-serif text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {article.adjacentArticles.prev.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {article.adjacentArticles.next ? (
              <Link
                href={`/articles/${article.adjacentArticles.next.slug}`}
                className="group rounded-2xl border border-border bg-card p-4 text-right hover:border-primary/40 transition-colors"
              >
                <span className="flex items-center justify-end gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Next Article{' '}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="font-serif text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {article.adjacentArticles.next.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}

        {/* Related Articles */}
        {article.relatedArticles.length > 0 && (
          <section
            aria-labelledby="related-articles-heading"
            className="border-t border-border pt-12 space-y-6"
          >
            <h3
              id="related-articles-heading"
              className="font-serif text-2xl font-bold text-foreground"
            >
              Related Dispatches
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {article.relatedArticles.map((rel) => (
                <ArticleCard key={rel.id} article={rel} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
