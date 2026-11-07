'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Clock, Pause, Play } from 'lucide-react';

import type { PublicArticleSummary } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { siteConfig } from '@/config/site';
import { formatPublishedDate } from '@/lib/format';

interface HeroCarouselProps {
  readonly slides: readonly PublicArticleSummary[];
}

const ADVANCE_MS = 7000;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Home hero: the newest cover stories cross-fade behind the headline, with a
 * story picker and previous/next controls. Auto-advances
 * unless the reader hovers, focuses, pauses, or prefers reduced motion.
 */
export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;
  const autoplay = count > 1 && !paused && !hovering && !reducedMotion;

  const next = useCallback(() => setActive((i) => (i + 1) % Math.max(count, 1)), [count]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(next, ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, active, next]);

  const story = slides[active];
  const category = story?.categories[0];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Cover stories"
      className="w-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
    >
      <h1 className="sr-only">{siteConfig.name}</h1>
      <div className="relative isolate flex min-h-[min(46rem,calc(100svh-4rem))] flex-col overflow-hidden bg-emerald-950 text-white">
        {slides.map((slide, index) =>
          slide.featuredImage ? (
            <Image
              key={slide.id}
              src={slide.featuredImage.url}
              alt=""
              fill
              preload={index === 0}
              sizes="100vw"
              className={cn(
                '-z-20 object-cover transition-[opacity,transform] duration-1000 ease-out',
                index === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
              )}
            />
          ) : null,
        )}
        {count === 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,var(--color-emerald-500)_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,var(--color-emerald-800)_0%,transparent_60%)]"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/20" />
          <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/10 to-transparent" />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end gap-8 px-5 pb-6 pt-24 sm:px-8 sm:pb-8 lg:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {story ? (
              <div key={story.id} className="max-w-3xl" aria-live="polite">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 motion-safe:animate-rise">
                  <span className="rounded-full bg-white px-3 py-1 tracking-[0.15em] text-emerald-900">
                    Cover story
                  </span>
                  {category && (
                    <Link
                      href={`/categories/${category.slug}`}
                      className="touch-target underline-offset-4 hover:underline"
                    >
                      {category.name}
                    </Link>
                  )}
                </p>
                <h2 className="mt-5 font-serif text-4xl font-bold leading-[1.05] tracking-tight text-balance motion-safe:animate-rise [animation-delay:80ms] sm:text-6xl">
                  <Link href={`/articles/${story.slug}`} className="hover:text-white/90">
                    {story.title}
                  </Link>
                </h2>
                {story.excerpt && (
                  <p className="mt-4 line-clamp-2 max-w-2xl text-base leading-relaxed text-white/80 motion-safe:animate-rise [animation-delay:160ms] sm:text-lg">
                    {story.excerpt}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 motion-safe:animate-rise [animation-delay:240ms]">
                  <Link
                    href={`/articles/${story.slug}`}
                    className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-950 shadow-lg transition-transform duration-200 ease-out hover:bg-emerald-50 active:scale-[0.97]"
                  >
                    Read the story
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    />
                  </Link>
                  <p className="flex flex-wrap items-center gap-x-3 text-sm text-white/75">
                    {story.author && (
                      <span className="inline-flex items-center gap-2 font-semibold text-white">
                        <AuthorAvatar
                          name={story.author.displayName}
                          avatarUrl={story.author.avatarUrl}
                          className="size-7 bg-white/15 text-[10px] text-white ring-white/30"
                        />
                        {story.author.displayName}
                      </span>
                    )}
                    <span>{formatPublishedDate(story.publishedAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {story.readingTimeMinutes} min read
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <h2 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                  {siteConfig.tagline}
                </h2>
                <p className="mt-4 text-lg text-white/80">
                  The first stories are being written. Check back soon.
                </p>
              </div>
            )}

            {count > 1 && (
              <div className="w-full shrink-0 rounded-3xl border border-white/15 bg-black/25 p-2 backdrop-blur-xl lg:w-80">
                <div className="flex items-center justify-between px-2 pb-1 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
                    More cover stories
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
                    className="inline-flex size-10 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
                  >
                    {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </button>
                </div>
                <ul className="space-y-1">
                  {slides.map((slide, index) => (
                    <li key={slide.id}>
                      <button
                        type="button"
                        onClick={() => setActive(index)}
                        aria-current={index === active ? 'true' : undefined}
                        aria-label={`Show cover story: ${slide.title}`}
                        className={cn(
                          'relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-2 text-left transition-colors duration-200',
                          index === active ? 'bg-white/15' : 'hover:bg-white/10',
                        )}
                      >
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                          {slide.featuredImage && (
                            <Image
                              src={slide.featuredImage.url}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          )}
                        </span>
                        <span className="line-clamp-2 text-sm font-semibold leading-snug">
                          {slide.title}
                        </span>
                        {index === active && autoplay && (
                          <span
                            aria-hidden="true"
                            key={`progress-${active}`}
                            className="absolute inset-x-2 bottom-0 h-0.5 origin-left rounded-full bg-white/80 motion-safe:animate-[hero-progress_7s_linear_both]"
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {count > 1 && (
            <div className="flex items-center justify-end gap-3 border-t border-white/15 pt-4">
              <span className="font-mono text-xs font-semibold tracking-widest text-white/80">
                {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setActive((i) => (i - 1 + count) % count)}
                aria-label="Previous cover story"
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next cover story"
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/15"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
