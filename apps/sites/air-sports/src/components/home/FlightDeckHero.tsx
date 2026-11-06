import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import type {
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventSummary,
} from '@multi-site-cms/types';

import { siteConfig } from '@/config/site';
import { formatPublishedDate } from '@/lib/format';

import { EventsPanel } from './EventsPanel';

interface FlightDeckHeroProps {
  readonly lead: PublicArticleSummary | undefined;
  readonly events: readonly PublicEventSummary[];
  /** Disciplines with published coverage, shown as quick links. */
  readonly disciplines: readonly PublicCategoryItem[];
}

/**
 * Always-dark "flight deck" opener: the newest dispatch over its own image,
 * with live/upcoming events beside it. All content comes from the CMS.
 */
export function FlightDeckHero({ lead, events, disciplines }: FlightDeckHeroProps) {
  const category = lead?.categories[0];
  const isBreaking = lead?.templateKey === 'breaking';

  return (
    <section
      aria-labelledby="deck-heading"
      className="dark relative isolate overflow-hidden bg-neutral-950 text-white [color-scheme:dark]"
    >
      <h1 className="sr-only">{siteConfig.name}</h1>

      {lead?.featuredImage && (
        <Image
          src={lead.featuredImage.url}
          alt=""
          fill
          preload
          sizes="100vw"
          className="-z-20 object-cover opacity-90 motion-safe:animate-cover-zoom"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/45 to-neutral-950/10" />
        <div className="absolute inset-0 bg-linear-to-r from-neutral-950/85 via-neutral-950/30 to-transparent" />
        <div className="absolute -right-40 -top-40 size-[36rem] rounded-full bg-brand-500/20 blur-3xl" />
        {/* Altitude grid: thin lines that read as instrument markings. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-size-[72px_72px] mask-[linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="mx-auto flex min-h-[min(38rem,calc(100svh-5rem))] max-w-7xl flex-col justify-end gap-8 px-4 pb-8 pt-20 sm:px-6 sm:pb-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 motion-safe:animate-rise">
            <span
              className={
                isBreaking
                  ? 'rounded-sm bg-rose-500 px-2 py-1 text-white'
                  : 'rounded-sm bg-brand-400 px-2 py-1 text-brand-950'
              }
            >
              {isBreaking ? 'Breaking' : 'Latest dispatch'}
            </span>
            {category && (
              <Link href={`/categories/${category.slug}`} className="hover:text-white">
                {category.name}
              </Link>
            )}
            {lead && <span>{formatPublishedDate(lead.publishedAt)}</span>}
          </p>

          <h2
            id="deck-heading"
            className="mt-6 text-4xl font-black uppercase leading-[0.95] tracking-tight text-balance motion-safe:animate-rise [animation-delay:100ms] sm:text-6xl lg:text-7xl"
          >
            {lead ? (
              <Link href={`/articles/${lead.slug}`} className="hover:text-brand-100">
                {lead.title}
              </Link>
            ) : (
              siteConfig.tagline
            )}
          </h2>

          {/* Only the story's own deck; with no story, describe the site instead. */}
          {(lead ? lead.excerpt : siteConfig.description) && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 motion-safe:animate-rise [animation-delay:200ms] sm:text-lg">
              {lead ? lead.excerpt : siteConfig.description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3 motion-safe:animate-rise [animation-delay:300ms]">
            {lead && (
              <Link
                href={`/articles/${lead.slug}`}
                className="group inline-flex items-center gap-2 rounded-full bg-brand-400 px-6 py-3.5 text-sm font-bold text-brand-950 transition-[transform,background-color] duration-200 ease-out hover:bg-brand-300 active:scale-[0.97]"
              >
                Read dispatch
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                />
              </Link>
            )}
            <Link
              href="/articles"
              className="inline-flex items-center rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              All dispatches
            </Link>
          </div>

          {disciplines.length > 0 && (
            <nav
              aria-label="Disciplines"
              className="mt-8 flex flex-wrap items-center gap-2 motion-safe:animate-rise [animation-delay:400ms]"
            >
              <span className="mr-1 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/55">
                Disciplines
              </span>
              {disciplines.map((discipline) => (
                <Link
                  key={discipline.id}
                  href={`/categories/${discipline.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur transition-colors duration-200 hover:border-white/40 hover:bg-white/10"
                >
                  {discipline.name}
                  <span className="font-mono text-[10px] text-white/50">
                    {discipline.postCount}
                  </span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        <EventsPanel events={events} />
      </div>
    </section>
  );
}
