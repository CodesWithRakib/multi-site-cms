import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { siteConfig } from '@/config/site';
import { formatPublishedDate } from '@/lib/format';

import { CoverStoryAside } from './CoverStoryAside';

interface CoverStoryProps {
  readonly lead: PublicArticleSummary | undefined;
  readonly alsoNew: readonly PublicArticleSummary[];
}

const reveal = 'motion-safe:animate-rise';

/**
 * Full-bleed "magazine cover": the newest published story is the hero, its
 * featured image the backdrop. Everything shown comes from the CMS.
 */
export function CoverStory({ lead, alsoNew }: CoverStoryProps) {
  const category = lead?.categories[0];

  return (
    <section aria-labelledby="cover-heading" className="px-3 pt-3 sm:px-4 sm:pt-4">
      <h1 className="sr-only">{siteConfig.name}</h1>
      <div className="relative isolate flex min-h-[min(40rem,calc(100svh-7rem))] overflow-hidden rounded-[2rem] bg-emerald-950 text-white">
        {lead?.featuredImage ? (
          <Image
            src={lead.featuredImage.url}
            alt=""
            fill
            preload
            sizes="100vw"
            className="-z-10 object-cover motion-safe:animate-cover-zoom"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-emerald-500)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,var(--color-emerald-800)_0%,transparent_60%)] opacity-70"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/35 to-black/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-r from-black/50 via-transparent to-transparent"
        />

        <div className="mx-auto flex w-full max-w-7xl flex-col justify-end gap-10 px-5 pb-8 pt-24 sm:px-8 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-14">
          {lead ? (
            <div className="max-w-3xl">
              <p
                className={`${reveal} flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80`}
              >
                <span className="rounded-full bg-white px-3 py-1 tracking-[0.15em] text-emerald-900">
                  Cover story
                </span>
                {category && (
                  <Link
                    href={`/categories/${category.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {category.name}
                  </Link>
                )}
              </p>

              <h2
                id="cover-heading"
                className={`${reveal} mt-5 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-balance [animation-delay:100ms] sm:text-6xl lg:text-7xl`}
              >
                <Link href={`/articles/${lead.slug}`} className="hover:text-white/90">
                  {lead.title}
                </Link>
              </h2>

              {lead.excerpt && (
                <p
                  className={`${reveal} mt-5 max-w-2xl text-base leading-relaxed text-white/80 [animation-delay:200ms] sm:text-lg`}
                >
                  {lead.excerpt}
                </p>
              )}

              <div
                className={`${reveal} mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:300ms]`}
              >
                <Link
                  href={`/articles/${lead.slug}`}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 shadow-lg transition-transform duration-200 ease-out hover:bg-emerald-50 active:scale-[0.97]"
                >
                  Read the story
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  />
                </Link>
                <p className="flex flex-wrap items-center gap-x-3 text-sm text-white/75">
                  {lead.author && (
                    <span className="font-semibold text-white">{lead.author.displayName}</span>
                  )}
                  <span>{formatPublishedDate(lead.publishedAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock aria-hidden="true" className="size-3.5" />
                    {lead.readingTimeMinutes} min read
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl">
              <h2
                id="cover-heading"
                className={`${reveal} font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl`}
              >
                {siteConfig.tagline}
              </h2>
              <p className={`${reveal} mt-5 text-lg text-white/80 [animation-delay:150ms]`}>
                The first stories are being written. Check back soon.
              </p>
            </div>
          )}

          {alsoNew.length > 0 && <CoverStoryAside articles={alsoNew} />}
        </div>
      </div>
    </section>
  );
}
