import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Radio } from 'lucide-react';

import { AirSportsCard } from '@/components/cards/AirSportsCard';
import { siteConfig } from '@/config/site';
import { fetchArticles } from '@/lib/api';

const PAGE_SIZE = 12;

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

/** Accepts only a positive integer page; anything else falls back to page 1. */
function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const page = parsePage((await searchParams).page);
  const canonical = page > 1 ? `/articles?page=${page}` : '/articles';

  return {
    title: page > 1 ? `All Dispatches — Page ${page}` : 'All Dispatches',
    description: `Every published news story, race report, and live dispatch from ${siteConfig.name}.`,
    alternates: { canonical },
    openGraph: { title: `All Dispatches | ${siteConfig.name}`, url: canonical },
  };
}

export default async function ArticlesIndexPage({ searchParams }: ArticlesPageProps) {
  const page = parsePage((await searchParams).page);
  const result = await fetchArticles({ page, limit: PAGE_SIZE });
  const totalPages = Math.max(1, result.totalPages);

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Radar
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Dispatches</span>
        </nav>

        <header className="mb-10 border-b border-border pb-6">
          <div className="mb-2 flex items-center gap-2">
            <Newspaper className="size-4 text-primary" aria-hidden="true" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Archive
            </span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-foreground sm:text-5xl">
            All Dispatches
          </h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            {result.total} Published Dispatch{result.total === 1 ? '' : 'es'}
          </p>
        </header>

        {result.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Radio className="mx-auto mb-3 size-10 text-muted-foreground/40" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">
              {page > 1 ? 'No dispatches on this page' : 'No dispatches published yet'}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Check back soon, or follow live events as they happen.
            </p>
            <Link
              href={page > 1 ? '/articles' : '/events'}
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-bold uppercase text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {page > 1 ? 'Back to first page' : 'View live events'}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <AirSportsCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-12 flex items-center justify-between border-t border-border pt-6 font-mono text-xs"
          >
            {page > 1 ? (
              <Link
                href={page === 2 ? '/articles' : `/articles?page=${page - 1}`}
                rel="prev"
                className="rounded-lg border border-border px-4 py-2 font-bold uppercase hover:border-primary hover:text-primary"
              >
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground" aria-current="page">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/articles?page=${page + 1}`}
                rel="next"
                className="rounded-lg border border-border px-4 py-2 font-bold uppercase hover:border-primary hover:text-primary"
              >
                Older →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
