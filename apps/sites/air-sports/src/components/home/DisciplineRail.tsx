import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Wind } from 'lucide-react';

import type { DisciplineCard } from '@/lib/home-feed';

/**
 * "Pick your sky": tall poster cards, one per discipline that has coverage, on a
 * swipeable rail (scroll-snap on touch). Each card borrows the cover of its own
 * newest dispatch, so the artwork is always real.
 */
export function DisciplineRail({
  disciplines,
}: {
  readonly disciplines: readonly DisciplineCard[];
}) {
  if (disciplines.length === 0) return null;

  return (
    <section aria-labelledby="disciplines-heading" className="space-y-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
          <h2
            id="disciplines-heading"
            className="text-2xl font-black uppercase tracking-tight text-foreground"
          >
            Pick your sky
          </h2>
          <Link
            href="/categories"
            className="touch-target group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
          >
            All disciplines
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      <ul className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 sm:scroll-px-6 sm:px-6 lg:scroll-px-8 lg:px-8 [scrollbar-width:thin]">
        {disciplines.map(({ category, image }) => (
          <li key={category.id} className="w-44 shrink-0 snap-start sm:w-52">
            <Link
              href={`/categories/${category.slug}`}
              className="group relative isolate flex aspect-3/4 flex-col justify-end overflow-hidden rounded-3xl bg-neutral-950 p-4 text-white ring-1 ring-black/5"
            >
              {image ? (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 176px, 208px"
                  className="-z-10 object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.07]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-500)_0%,transparent_60%),linear-gradient(to_bottom,var(--color-brand-950),var(--color-neutral-950))]"
                >
                  <Wind className="size-10 text-white/30" />
                </span>
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/20 to-transparent"
              />
              <span className="text-xl font-black uppercase leading-tight tracking-tight text-balance">
                {category.name}
              </span>
              <span className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors group-hover:text-white">
                Explore
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
