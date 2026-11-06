import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Radio, Tag as TagIcon } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { fetchTags } from '@/lib/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Air Sports Tags',
  description: 'Explore air sports tags, flight descriptors, aircraft classes, and pilot tags.',
  alternates: {
    canonical: '/tags',
  },
  openGraph: {
    title: `Tags Index | ${siteConfig.name}`,
    description: 'Explore air sports topics, tags, and pilots.',
    url: '/tags',
  },
};

export default async function TagsPage() {
  const tags = await fetchTags();

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
          <span className="text-foreground">Tags</span>
        </nav>

        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Tag Index
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Topic & Event Tags
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground font-sans">
            Indexed cross-cutting tags for flight categories, equipment classes, and geographic race
            zones.
          </p>
        </div>

        {tags.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
            <Radio className="mx-auto size-12 text-muted-foreground/40 mb-3" />
            <h2 className="text-lg font-bold text-foreground">No Tags Available</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Tags created in published articles will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="group flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-mono text-foreground hover:border-primary hover:text-primary transition-all shadow-xs"
              >
                <span className="font-bold">#{tag.name}</span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {tag.postCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
