import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Wind } from 'lucide-react';

import type { PublicCategoryItem } from '@multi-site-cms/types';

/**
 * Decorative artwork for well-known discipline slugs. Categories have no image
 * field in the CMS yet, so unknown slugs get a token-colored placeholder.
 */
const DISCIPLINE_ARTWORK: Readonly<Record<string, string>> = {
  paragliding:
    'https://images.unsplash.com/photo-1712841609467-51396e30f964?auto=format&fit=crop&w=800&q=80',
  skydiving:
    'https://images.unsplash.com/photo-1483301563007-8d0161daa1d0?auto=format&fit=crop&w=800&q=80',
  'hot-air-balloon':
    'https://res.cloudinary.com/cdikzkfd/image/upload/v1793558261/multi-site-cms/air-sports/cappadocia-hot-air-balloons-1793558261806.jpg',
  'ultralight-flight':
    'https://images.unsplash.com/photo-1786378966016-c4fe403bd7a3?auto=format&fit=crop&w=800&q=80',
};

const MAX_CARDS = 4;

interface PopularAirSportsProps {
  readonly categories: readonly PublicCategoryItem[];
}

/**
 * Disciplines with the most published coverage, straight from the CMS.
 * Shows only real data (name, description, dispatch count); renders nothing
 * when no category has published posts yet.
 */
export function PopularAirSports({ categories }: PopularAirSportsProps) {
  const popular = [...categories]
    .filter((category) => category.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, MAX_CARDS);

  if (popular.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8"
      id="activities"
      aria-labelledby="popular-disciplines-heading"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Most Covered Disciplines
          </span>
          <h2
            id="popular-disciplines-heading"
            className="font-serif text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            Thrilling Activities in the{' '}
            <span className="font-handwriting text-3xl font-bold italic text-primary sm:text-5xl">
              Sky
            </span>
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            The air sports our reporters cover most, with the latest dispatches for each.
          </p>
        </div>

        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 sm:self-auto"
        >
          <span>View All Disciplines</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {popular.map((category) => {
          const artwork = DISCIPLINE_ARTWORK[category.slug];
          const href = `/categories/${category.slug}`;

          return (
            <article
              key={category.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-muted">
                  {artwork ? (
                    <Image
                      src={artwork}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-primary/10">
                      <Wind className="h-10 w-10 text-primary/60" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 p-4 sm:p-5">
                  <h3 className="text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    <Link href={href}>{category.name}</Link>
                  </h3>
                  {category.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 sm:px-5">
                <span className="font-mono text-xs text-muted-foreground">
                  {category.postCount} dispatch{category.postCount === 1 ? '' : 'es'}
                </span>
                <Link
                  href={href}
                  aria-label={`Explore ${category.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
