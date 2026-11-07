import type { Metadata } from 'next';
import Image from 'next/image';
import { BookOpen, Compass, Globe, Heart, Shield, Sparkles, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { NewsletterBanner } from '@/components/home/NewsletterBanner';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { siteConfig } from '@/config/site';
import { fetchArticles, fetchSiteConfig } from '@/lib/api';
import { resolveAboutContent } from '@/lib/about';
import { collectAuthors } from '@/lib/authors';

export const revalidate = 300;

/** Enough recent stories to find a cover image and every active author. */
const ABOUT_ARTICLE_LIMIT = 30;

/** Decorative icons for the owner's value cards, cycled in order. */
const PILLAR_ICONS: readonly LucideIcon[] = [Compass, Globe, Shield, Sparkles, BookOpen, Heart];

async function loadAbout() {
  const config = await fetchSiteConfig();
  return resolveAboutContent(config, {
    name: siteConfig.name,
    description: siteConfig.description,
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const about = await loadAbout();
  return {
    title: 'About Us',
    description: about.summary,
    alternates: { canonical: '/about' },
  };
}

export default async function AboutPage() {
  const [about, { items }] = await Promise.all([
    loadAbout(),
    fetchArticles({ limit: ABOUT_ARTICLE_LIMIT }),
  ]);
  const cover = items.find((article) => article.featuredImage);
  const authors = about.showWriters ? collectAuthors(items) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-16 space-y-16">
      {/* Editorial hero: all text is written by the site owner in the admin. */}
      <header className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <Sparkles className="h-3.5 w-3.5" /> {about.eyebrow}
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12] text-balance">
          {about.headline}
          {about.highlight && (
            <>
              {' '}
              <span className="font-handwriting text-emerald-500 dark:text-emerald-400 text-4xl sm:text-6xl font-bold">
                {about.highlight}
              </span>
            </>
          )}
        </h1>
        <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          {about.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
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

      {/* Value cards written by the owner. */}
      {about.pillars.length > 0 && (
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {about.pillars.map((pillar, index) => {
            const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length] ?? Sparkles;
            return (
              <div
                key={index}
                className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-3 shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">{pillar.title}</h2>
                {pillar.body && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.body}
                  </p>
                )}
              </div>
            );
          })}
        </section>
      )}

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
