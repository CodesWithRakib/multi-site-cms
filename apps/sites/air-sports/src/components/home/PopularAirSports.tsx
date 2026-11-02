'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock, Heart, Star } from 'lucide-react';

interface ActivityItem {
  id: string;
  name: string;
  slug: string;
  badge: string;
  badgeColor: string;
  description: string;
  rating: number;
  reviews: string;
  duration: string;
  image: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'paragliding',
    name: 'Paragliding',
    slug: 'paragliding',
    badge: 'Popular',
    badgeColor: 'bg-emerald-500 text-white',
    description: 'Soar like a bird over breathtaking alpine landscapes and deep valleys.',
    rating: 4.8,
    reviews: '12k+ reviews',
    duration: '1-3 hrs',
    image: 'https://images.unsplash.com/photo-1712841609467-51396e30f964?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'skydiving',
    name: 'Skydiving',
    slug: 'skydiving',
    badge: 'Trending',
    badgeColor: 'bg-sky-500 text-white',
    description: 'Experience the ultimate adrenaline-pumping freefall adventure at 12,000 ft.',
    rating: 4.9,
    reviews: '8k+ reviews',
    duration: '1-2 hrs',
    image: 'https://images.unsplash.com/photo-1483301563007-8d0161daa1d0?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'hot-air-balloon',
    name: 'Hot Air Balloon',
    slug: 'hot-air-balloon',
    badge: 'Top Rated',
    badgeColor: 'bg-teal-500 text-white',
    description: 'Enjoy a peaceful sunrise glide above surreal volcanic formations.',
    rating: 4.7,
    reviews: '6k+ reviews',
    duration: '1-2 hrs',
    image: 'https://res.cloudinary.com/cdikzkfd/image/upload/v1793558261/multi-site-cms/air-sports/cappadocia-hot-air-balloons-1793558261806.jpg',
  },
  {
    id: 'ultralight-flight',
    name: 'Ultralight Flight',
    slug: 'ultralight-flight',
    badge: 'Scenic',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'A unique open-cockpit way to view mountain ridges and ocean coastlines.',
    rating: 4.8,
    reviews: '4k+ reviews',
    duration: '30 min',
    image: 'https://images.unsplash.com/photo-1786378966016-c4fe403bd7a3?auto=format&fit=crop&w=800&q=80',
  },
];

export function PopularAirSports() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8" id="activities">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Popular Air Sports
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Thrilling Activities in the{' '}
            <span className="font-handwriting text-3xl sm:text-5xl text-emerald-500 font-bold italic">
              Sky
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Discover the most exciting air sports and plan your next flight adventure today.
          </p>
        </div>

        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <span>View All Air Sports</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ACTIVITIES.map((item) => {
          const isFav = favorites.includes(item.id);

          return (
            <article
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                {/* Media Container */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Badge */}
                  <span
                    className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${item.badgeColor} shadow-xs`}
                  >
                    {item.badge}
                  </span>

                  {/* Favorite Trigger */}
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(item.id, e)}
                    aria-label={`Favorite ${item.name}`}
                    className={`absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-md transition ${
                      isFav
                        ? 'bg-rose-500 text-white'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 space-y-2">
                  <h3 className="text-base font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    <Link href={`/categories/${item.slug}`}>{item.name}</Link>
                  </h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom Metrics & Arrow Link */}
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-foreground">{item.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({item.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{item.duration}</span>
                  </div>
                </div>

                <Link
                  href={`/categories/${item.slug}`}
                  aria-label={`Explore ${item.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-foreground transition group-hover:bg-sky-600 group-hover:text-white"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
