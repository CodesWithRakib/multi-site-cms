import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Radio, Tag as TagIcon } from 'lucide-react';

import { PaginationLinks, pageHref, parsePageParam } from '@multi-site-cms/ui';

import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchTags } from '@/lib/api';

/** Articles per archive page; further pages are `?page=N`. */
const PAGE_SIZE = 24;

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const tags = await fetchTags();
  const tag = tags.find((t) => t.slug === slug);

  const title = tag ? `#${tag.name} Tagged Coverage` : `#${slug} Coverage`;
  const description = `Live updates and news tagged #${tag?.name || slug}.`;

  return {
    title,
    description,
    alternates: {
      canonical: pageHref(`/tags/${slug}`, page),
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `/tags/${slug}`,
    },
  };
}

export default async function TagArchivePage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const page = parsePageParam((await searchParams).page);
  const [articlesRes, tags] = await Promise.all([
    fetchArticles({ tagSlug: slug, page, limit: PAGE_SIZE }),
    fetchTags(),
  ]);

  const tag = tags.find((t) => t.slug === slug);
  const articles = articlesRes.items;
  const totalPages = Math.max(1, articlesRes.totalPages);

  // A stale or crafted page past the end goes back to the first page.
  if (page > 1 && articles.length === 0) redirect(`/tags/${slug}`);

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/tags" className="hover:text-primary transition-colors">
            Tags
          </Link>
          <span>/</span>
          <span className="text-foreground">#{tag?.name || slug}</span>
        </nav>

        {/* Header */}
        <div className="mb-10 border-b border-border pb-6">
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Tag Archive
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            #{tag?.name || slug}
          </h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            {articlesRes.total} Published Dispatch{articlesRes.total === 1 ? '' : 'es'}
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
            <Radio className="mx-auto size-10 text-muted-foreground/40 mb-3" />
            <h2 className="text-base font-bold text-foreground">No Dispatches Bearing This Tag</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Explore other aviation topic tags.
            </p>
            <Link
              href="/tags"
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse All Tags
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <AirSportsCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        )}

        <PaginationLinks
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => pageHref(`/tags/${slug}`, target)}
          linkComponent={Link}
          label="Tag pages"
          className="mt-12 border-t border-border pt-6"
        />
      </div>
    </div>
  );
}
