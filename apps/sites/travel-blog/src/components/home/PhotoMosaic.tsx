import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Camera, Clock } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { Reveal } from '@/components/ui/Reveal';

interface PhotoMosaicProps {
  readonly stories: readonly PublicArticleSummary[];
}

/**
 * Bento layout on a 4-column grid (sm and up), in placement order. Seven tiles
 * fill three rows exactly: the feature is 2x2, one tile is tall, one is wide.
 * Below `sm` the same tiles are one swipeable strip instead.
 */
const TILE_SPANS = [
  'sm:col-span-2 sm:row-span-2',
  '',
  '',
  'sm:row-span-2',
  '',
  'sm:col-span-2',
  '',
] as const;

const MIN_TILES = 4;

/**
 * "Places in pictures": cover photos of recent stories, each captioned with its
 * topic and title so the photo is never the only clue to where the link goes.
 * Tiles enter one after another as the section scrolls into view.
 */
export function PhotoMosaic({ stories }: PhotoMosaicProps) {
  const tiles = stories.filter((story) => story.featuredImage).slice(0, TILE_SPANS.length);
  if (tiles.length < MIN_TILES) return null;

  return (
    <section aria-labelledby="mosaic-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Camera aria-hidden="true" className="size-3.5" /> Through the lens
          </p>
          <h2
            id="mosaic-heading"
            className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Places in pictures
          </h2>
        </div>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Select a photo to read its story
        </p>
      </div>

      <ul
        className={cn(
          '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none]',
          'sm:mx-0 sm:grid sm:auto-rows-[12rem] sm:grid-flow-dense sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0',
          'lg:auto-rows-[13.5rem]',
        )}
      >
        {tiles.map((story, index) => {
          const isFeature = index === 0;
          // Tall tiles are scaled to fill their height, so they need a larger source.
          const isTall = TILE_SPANS[index]?.includes('row-span-2') ?? false;
          const category = story.categories[0];
          return (
            <li
              key={story.id}
              className={cn(
                'h-80 w-64 shrink-0 snap-center sm:h-auto sm:w-auto',
                TILE_SPANS[index],
              )}
            >
              <Reveal delay={index * 90} className="size-full">
                <Link
                  href={`/articles/${story.slug}`}
                  className="group relative block size-full overflow-hidden rounded-3xl bg-muted shadow-sm ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-xl"
                >
                  {story.featuredImage && (
                    <Image
                      src={story.featuredImage.url}
                      alt={story.featuredImage.altText || ''}
                      fill
                      sizes={
                        isFeature || isTall
                          ? '(max-width: 640px) 256px, 50vw'
                          : '(max-width: 640px) 256px, 25vw'
                      }
                      className="object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.07]"
                    />
                  )}

                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent"
                  />

                  <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 text-white sm:p-5">
                    {category && (
                      <span className="w-fit rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
                        {category.name}
                      </span>
                    )}
                    <span
                      className={cn(
                        'line-clamp-3 font-serif font-bold leading-snug text-balance transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5',
                        isFeature ? 'text-xl sm:text-3xl' : 'text-base sm:text-lg',
                      )}
                    >
                      {story.title}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-white/80">
                      <span className="inline-flex items-center gap-1">
                        <Clock aria-hidden="true" className="size-3.5" />
                        {story.readingTimeMinutes} min
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 font-semibold opacity-90 transition-[transform,opacity] duration-300 group-hover:opacity-100 motion-safe:group-hover:translate-x-0.5">
                        Read
                        <ArrowRight aria-hidden="true" className="size-3.5" />
                      </span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
