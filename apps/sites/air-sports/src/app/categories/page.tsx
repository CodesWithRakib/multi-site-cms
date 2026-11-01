import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, Radio } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { fetchCategories } from '@/lib/api';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Aviation Disciplines & Categories',
  description:
    'Browse air sports coverage across paragliding, wingsuit proximity, drone racing, aerobatics, and ballooning.',
  alternates: {
    canonical: '/categories',
  },
  openGraph: {
    title: `Categories & Disciplines | ${siteConfig.name}`,
    description: 'Browse news, records, and dispatches sorted by aviation discipline.',
    url: '/categories',
  },
};

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground"
        >
          <Link href="/" className="hover:text-primary transition-colors">
            Radar
          </Link>
          <span>/</span>
          <span className="text-foreground">Disciplines</span>
        </nav>

        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="size-4 text-primary" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
              Taxonomy Index
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-foreground">
            Aviation Disciplines
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground font-sans">
            Filter race feeds and technical dispatches across our primary competitive sectors.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card">
            <Radio className="mx-auto size-12 text-muted-foreground/40 mb-3" />
            <h2 className="text-lg font-bold text-foreground">No Categories Configured</h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Categories established in the centralized admin desk will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-foreground/30 hover:shadow-md transition-all"
              >
                <div>
                  <span className="font-mono text-xs text-primary font-bold">
                    {c.postCount} Published Dispatch{c.postCount === 1 ? '' : 'es'}
                  </span>
                  <h3 className="mt-2 text-xl font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {c.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 text-xs font-mono font-bold text-primary group-hover:translate-x-1 transition-transform">
                  View Category Feed →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
