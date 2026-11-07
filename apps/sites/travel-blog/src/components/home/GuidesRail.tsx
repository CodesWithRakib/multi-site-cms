import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';

import { ScenicArt } from '@/components/illustrations/ScenicArt';
import { StoryPlaceholder } from '@/components/illustrations/StoryPlaceholder';

interface GuidesRailProps {
  readonly guides: readonly PublicArticleSummary[];
}

/**
 * Trip-planning band: a swipeable row of destination guides on a dark,
 * illustrated background. Scroll-snaps on touch, and the row is keyboard
 * reachable because every card is a real link.
 */
export function GuidesRail({ guides }: GuidesRailProps) {
  if (guides.length === 0) return null;

  return (
    <section
      aria-labelledby="guides-heading"
      className="dark relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-brand-950 via-brand-900 to-brand-800 py-8 text-white [color-scheme:dark] sm:py-10"
    >
      <ScenicArt
        variant="mountains"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 w-full opacity-30"
      />

      <div className="flex items-end justify-between gap-4 px-5 sm:px-8">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-200">
            <MapPin aria-hidden="true" className="size-3.5" /> Plan your trip
          </p>
          <h2
            id="guides-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Destination guides
          </h2>
        </div>
        <Link
          href="/destinations"
          className="touch-target group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white"
        >
          All guides
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <ul className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-3 sm:scroll-px-8 sm:px-8 [scrollbar-width:thin]">
        {guides.map((guide) => (
          <li key={guide.id} className="w-64 shrink-0 snap-start sm:w-72">
            <article className="group relative h-full overflow-hidden rounded-2xl bg-white/8 ring-1 ring-white/15 backdrop-blur-sm transition-colors duration-200 hover:bg-white/12">
              <div className="relative aspect-4/3 overflow-hidden bg-brand-900">
                {guide.featuredImage ? (
                  <Image
                    src={guide.featuredImage.url}
                    alt={guide.featuredImage.altText || ''}
                    fill
                    sizes="288px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                  />
                ) : (
                  <StoryPlaceholder seed={guide.slug} />
                )}
              </div>
              <div className="space-y-1.5 p-4">
                {guide.categories[0] && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-200">
                    {guide.categories[0].name}
                  </p>
                )}
                <h3 className="line-clamp-2 font-serif text-lg font-bold leading-snug">
                  <Link
                    href={`/articles/${guide.slug}`}
                    className="after:absolute after:inset-0 after:z-10"
                  >
                    {guide.title}
                  </Link>
                </h3>
                <p className="inline-flex items-center gap-1 text-xs text-white/70">
                  <Clock aria-hidden="true" className="size-3.5" />
                  {guide.readingTimeMinutes} min read
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
