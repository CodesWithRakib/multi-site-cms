import type { Metadata } from 'next';
import Image from 'next/image';
import { Compass, Globe, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { siteConfig } from '@/config/site';
import { fetchArticles } from '@/lib/api';
import { collectAuthors } from '@/lib/authors';

export const revalidate = 300;

/** Enough recent stories to find a cover image and every active author. */
const ABOUT_ARTICLE_LIMIT = 30;

export const metadata: Metadata = {
  title: 'About Us — Travel Blog',
  description:
    'Considered, independent travel reporting, practical field guides, and immersive photojournalism.',
  alternates: {
    canonical: '/about',
  },
};

export default async function AboutPage() {
  const { items } = await fetchArticles({ limit: ABOUT_ARTICLE_LIMIT });
  const cover = items.find((article) => article.featuredImage);
  const authors = collectAuthors(items);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Editorial Hero */}
      <header className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> Our Mission & Manifesto
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
          Considered, independent <br />
          <span className="font-handwriting text-emerald-500 dark:text-emerald-400 text-4xl sm:text-6xl font-bold">
            travel reporting.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {siteConfig.name} was founded to provide practical, deeply researched itineraries and
          authentic travel storytelling designed to be useful years after publication.
        </p>
      </header>

      {/* Hero visual: the newest real cover story (CMS), never a stock photo. */}
      {cover?.featuredImage && (
        <Link
          href={`/articles/${cover.slug}`}
          className="group relative block aspect-video w-full overflow-hidden rounded-3xl bg-muted shadow-lg sm:aspect-21/9"
        >
          <Image
            src={cover.featuredImage.url}
            alt={cover.featuredImage.altText ?? cover.title}
            fill
            preload
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 max-w-xl space-y-1 text-white sm:inset-x-10 sm:bottom-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-200">
              Latest cover story
            </p>
            <p className="font-serif text-xl font-bold leading-snug text-balance sm:text-3xl">
              {cover.title}
            </p>
          </div>
        </Link>
      )}

      {/* Editorial Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Depth Over Clicks</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We spend weeks researching on the ground to build detailed, field-tested guides with
            practical transit, budget, and cultural insights.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Globe className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Local Respect & Nuance</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Human-scale travel journalism grounded in local communities, respecting indigenous
            histories and environmental realities.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Authentic Visuals</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            No synthetic distortion or heavily manipulated photos. Just genuine moments captured by
            explorers in natural light.
          </p>
        </div>
      </section>

      {/* Writers: real authors of published stories. */}
      {authors.length > 0 && (
        <section aria-labelledby="writers-heading" className="space-y-6">
          <h2
            id="writers-heading"
            className="font-serif text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
          >
            {authors.length === 1 ? 'Meet the writer' : 'Meet the writers'}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authors.map((author) => (
              <li
                key={author.id}
                className="flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs"
              >
                <AuthorAvatar
                  name={author.displayName}
                  avatarUrl={author.avatarUrl}
                  className="size-16 text-xl"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-foreground">
                    {author.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {author.storyCount} {author.storyCount === 1 ? 'story' : 'stories'} published
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterBanner />
    </div>
  );
}
