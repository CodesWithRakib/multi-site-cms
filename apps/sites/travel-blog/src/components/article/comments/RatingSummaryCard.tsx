import type { RatingSummary } from '@/lib/review';

import { RatingStars } from './RatingStars';

const STARS = [5, 4, 3, 2, 1] as const;

/** The average, how many ratings it rests on, and how they split across the stars. */
export function RatingSummaryCard({ summary }: { readonly summary: RatingSummary }) {
  if (summary.average === null || summary.count === 0) return null;
  const { average, count, breakdown } = summary;

  return (
    <div className="grid gap-5 rounded-3xl border border-border/80 bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10 sm:p-6">
      <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-2">
        <p className="font-serif text-5xl font-bold leading-none text-foreground">
          {average.toFixed(1)}
        </p>
        <div className="space-y-1">
          <RatingStars rating={average} size="md" />
          <p className="text-xs text-muted-foreground">
            Based on {count} {count === 1 ? 'rating' : 'ratings'}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5" aria-label="Ratings by star">
        {STARS.map((star) => {
          const n = breakdown[star];
          const share = count > 0 ? (n / count) * 100 : 0;
          return (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="w-10 shrink-0 font-semibold text-foreground">{star} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-amber-400"
                  style={{ width: `${share}%` }}
                />
              </span>
              <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">
                {n}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
