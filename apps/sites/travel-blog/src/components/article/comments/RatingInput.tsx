'use client';

import { useId, useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

import { ratingLabel } from '@/lib/review';

interface RatingInputProps {
  readonly value: number | null;
  readonly onChange: (value: number | null) => void;
}

/**
 * Star picker built from real radio buttons, so arrow keys, screen readers and
 * form semantics work without extra code. Nothing is pre-selected: a rating is
 * optional, and a default of five stars would skew every score upward.
 */
export function RatingInput({ value, onChange }: RatingInputProps) {
  const name = useId();
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-semibold text-foreground">
        Your rating <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <label
              key={star}
              onMouseEnter={() => setHover(star)}
              className="relative flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary"
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'}, ${ratingLabel(star)}`}
              />
              <Star
                aria-hidden="true"
                className={cn(
                  'size-7 transition-[color,fill,transform] duration-150 motion-safe:active:scale-90',
                  star <= shown ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-border',
                )}
              />
            </label>
          ))}
        </div>

        {/* Fixed height, so choosing a rating never moves the fields below. */}
        <p className="flex min-h-6 items-center gap-3 text-sm" aria-live="polite">
          {shown > 0 ? (
            <span className="font-semibold text-foreground">{ratingLabel(shown)}</span>
          ) : (
            <span className="text-muted-foreground">Tap a star</span>
          )}
          {value !== null && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      </div>
    </fieldset>
  );
}
