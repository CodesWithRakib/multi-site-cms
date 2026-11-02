import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { BookmarkButton, CategoryBadge, PillButton, StarRating } from '@/components/ui';

interface DestinationItem {
  id: string;
  name: string;
  country: string;
  region: 'europe' | 'asia' | 'america';
  rating: number;
  reviewsCount: string;
  slug: string;
  imageUrl: string;
  altText: string;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: 'dest-paris',
    name: 'Paris',
    country: 'France',
    region: 'europe',
    rating: 4.8,
    reviewsCount: '12k+ reviews',
    slug: '10-must-visit-places-europe',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    altText: 'Eiffel Tower standing tall in Paris',
  },
  {
    id: 'dest-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    region: 'asia',
    rating: 4.8,
    reviewsCount: '10k+ reviews',
    slug: 'tokyo-tradition-meets-modernity',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    altText: 'Chureito Pagoda and Mount Fuji in Japan',
  },
  {
    id: 'dest-santorini',
    name: 'Santorini',
    country: 'Greece',
    region: 'europe',
    rating: 4.8,
    reviewsCount: '8k+ reviews',
    slug: 'santorini-dreamy-escape',
    imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    altText: 'White and blue domed houses in Santorini Greece',
  },
  {
    id: 'dest-nyc',
    name: 'New York',
    country: 'USA',
    region: 'america',
    rating: 4.8,
    reviewsCount: '15k+ reviews',
    slug: 'sustainable-travel-europe',
    imageUrl: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80',
    altText: 'Manhattan skyline at dusk with empire state building',
  },
];

export function PopularDestinations() {
  return (
    <section id="destinations" aria-labelledby="popular-dest-heading" className="space-y-8 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Popular Destinations
            </span>
          </div>
          <h2
            id="popular-dest-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white"
          >
            Top Destinations Around the World
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Explore the most loved places by travelers like you.
          </p>
        </div>

        <PillButton
          href="/destinations"
          variant="outline"
          size="sm"
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          iconPosition="right"
          className="self-start sm:self-auto"
        >
          View All Destinations
        </PillButton>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DESTINATIONS.map((dest) => (
          <div
            key={dest.id}
            className="group relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
          >
            {/* Image Container with Badge */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
              <Image
                src={dest.imageUrl}
                alt={dest.altText}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

              {/* Region Badge */}
              <div className="absolute top-3 left-3 z-10">
                <CategoryBadge
                  label={dest.region.charAt(0).toUpperCase() + dest.region.slice(1)}
                  slug={dest.region}
                  size="sm"
                />
              </div>

              {/* Bookmark Button */}
              <div className="absolute top-3 right-3 z-10">
                <BookmarkButton articleId={dest.id} articleTitle={`${dest.name}, ${dest.country}`} size="sm" />
              </div>
            </div>

            {/* Card Content & Action Button */}
            <div className="p-4 flex items-center justify-between flex-1">
              <div className="space-y-1">
                <Link
                  href={`/articles/${dest.slug}`}
                  className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1"
                >
                  {dest.name}, {dest.country}
                </Link>
                <StarRating rating={dest.rating} reviewsCount={dest.reviewsCount} size="sm" />
              </div>

              {/* Circular Action Arrow */}
              <Link
                href={`/articles/${dest.slug}`}
                aria-label={`Explore ${dest.name}, ${dest.country}`}
                className="h-9 w-9 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shrink-0 ml-2"
              >
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

