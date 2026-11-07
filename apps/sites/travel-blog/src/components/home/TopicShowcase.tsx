import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

import type { TopicCard } from '@/lib/home-feed';

interface TopicShowcaseProps {
  readonly topics: readonly TopicCard[];
}

/** Visual entry points into the busiest CMS topics. */
export function TopicShowcase({ topics }: TopicShowcaseProps) {
  if (topics.length === 0) return null;

  return (
    <section aria-labelledby="topics-heading" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Find your next trip
          </p>
          <h2
            id="topics-heading"
            className="mt-1.5 font-serif text-3xl font-bold tracking-tight text-foreground"
          >
            Explore by topic
          </h2>
        </div>
        <Link
          href="/categories"
          className="touch-target group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
        >
          All topics
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {topics.map(({ category, image }) => (
          <li key={category.id}>
            <Link
              href={`/categories/${category.slug}`}
              className="group relative flex aspect-4/5 flex-col justify-end overflow-hidden rounded-3xl bg-emerald-900 p-4 text-white sm:aspect-square sm:p-5"
            >
              {image && (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              )}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent"
              />
              <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors duration-200 group-hover:bg-white group-hover:text-emerald-900">
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
              <span className="relative">
                <span className="block font-serif text-xl font-bold sm:text-2xl">
                  {category.name}
                </span>
                <span className="mt-0.5 block text-xs font-medium text-white/80">
                  {category.postCount} {category.postCount === 1 ? 'story' : 'stories'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
