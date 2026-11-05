import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Calendar, Clock } from 'lucide-react';
import type { PublicArticleSummary } from '@multi-site-cms/types';
import { BookmarkButton, CategoryBadge, PillButton } from '@/components/ui';

interface TravelGuidesSectionProps {
  articles: PublicArticleSummary[];
}

export function TravelGuidesSection({ articles }: TravelGuidesSectionProps) {
  // Use first 4 articles or default display
  const guides = articles.slice(0, 4);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <section aria-labelledby="travel-guides-heading" className="space-y-8 pt-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-emerald-500 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Travel Guides
            </span>
          </div>
          <h2
            id="travel-guides-heading"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white"
          >
            Plan Better, Travel Smarter
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Expert tips and guides to make your next trip unforgettable.
          </p>
        </div>

        <PillButton
          href="/articles"
          variant="outline"
          size="sm"
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          iconPosition="right"
          className="self-start sm:self-auto"
        >
          View All Guides
        </PillButton>
      </div>

      {/* 4 Guides Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {guides.map((art) => {
          const category = art.categories[0] ?? { name: 'Travel Tips', slug: 'travel-tips' };
          const imgUrl =
            art.featuredImage?.url ||
            'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

          return (
            <article
              key={art.id}
              className="group relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image & Badges */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <Image
                  src={imgUrl}
                  alt={art.featuredImage?.altText || art.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity" />

                {/* Category Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <CategoryBadge label={category.name} slug={category.slug} size="sm" />
                </div>

                {/* Bookmark Button */}
                <div className="absolute top-3 right-3 z-10">
                  <BookmarkButton articleId={art.id} articleTitle={art.title} size="sm" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                    <Link href={`/articles/${art.slug}`}>{art.title}</Link>
                  </h3>
                </div>

                {/* Meta row & Action Arrow */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{formatDate(art.publishedAt)}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{art.readingTimeMinutes} min</span>
                    </span>
                  </div>

                  <Link
                    href={`/articles/${art.slug}`}
                    aria-label={`Read guide: ${art.title}`}
                    className="h-8 w-8 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shrink-0 ml-1"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
