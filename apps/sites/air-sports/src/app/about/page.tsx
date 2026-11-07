import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Compass, Plane, Radio, Shield, Sparkles, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { collectAuthors } from '@multi-site-cms/ui';
import { resolveAboutContent } from '@multi-site-cms/validation/site-about';

import { AirSportsNewsletter } from '@/components/home/AirSportsNewsletter';
import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { defaultOgImage, siteConfig } from '@/config/site';
import { fetchArticles, fetchSiteConfig } from '@/lib/api';

export const revalidate = 300;

/** Enough recent dispatches to find every active author. */
const ABOUT_ARTICLE_LIMIT = 30;

/** Decorative icons for the owner's value cards, cycled in order. */
const PILLAR_ICONS: readonly LucideIcon[] = [Radio, Shield, Compass, Wind, Plane, Sparkles];

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
    // A page that sets its own openGraph replaces the root one, so repeat the share card.
    openGraph: {
      images: [defaultOgImage],
      title: `About Us | ${siteConfig.name}`,
      description: about.summary,
      url: '/about',
    },
  };
}

export default async function AboutPage() {
  const [about, { items }] = await Promise.all([
    loadAbout(),
    fetchArticles({ limit: ABOUT_ARTICLE_LIMIT }),
  ]);
  const authors = about.showWriters ? collectAuthors(items) : [];

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl space-y-14 px-4 sm:space-y-20 sm:px-6 lg:px-8">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">About</span>
          </nav>

          {/* Hero: every word here is written by the site owner in the admin. */}
          <header className="max-w-3xl space-y-5 border-b border-border pb-10">
            <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles aria-hidden="true" className="size-4" />
              {about.eyebrow}
            </span>
            <h1 className="text-balance text-4xl font-black uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {about.headline}
              {about.highlight && (
                <>
                  {' '}
                  <span className="text-primary">{about.highlight}</span>
                </>
              )}
            </h1>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {about.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/articles"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Read the dispatches
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                href="/events"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                See events
              </Link>
            </div>
          </header>
        </div>

        {about.pillars.length > 0 && (
          <section
            aria-label="What we stand for"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {about.pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[index % PILLAR_ICONS.length] ?? Sparkles;
              return (
                <div
                  key={index}
                  className="space-y-3 rounded-3xl border border-border bg-card p-6 shadow-xs sm:p-8"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">{pillar.title}</h2>
                  {pillar.body && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {authors.length > 0 && (
          <section aria-labelledby="writers-heading" className="space-y-6">
            <h2
              id="writers-heading"
              className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl"
            >
              {authors.length === 1 ? 'Meet the writer' : 'Meet the writers'}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {authors.map((author) => (
                <li
                  key={author.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
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
                      {author.storyCount} {author.storyCount === 1 ? 'dispatch' : 'dispatches'}{' '}
                      published
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Brings its own container, so it sits outside the padded one above. */}
      <div className="mt-14 sm:mt-20">
        <AirSportsNewsletter />
      </div>
    </div>
  );
}
