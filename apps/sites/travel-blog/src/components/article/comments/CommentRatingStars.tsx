'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface CommentRatingStarsProps {
  rating: number | null;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const ratingLabels: Record<number, string> = {
  1: 'Poor expedition',
  2: 'Fair dispatch',
  3: 'Good story',
  4: 'Great adventure',
  5: 'Exceptional journey',
};

export function CommentRatingStars({
  rating,
  interactive = false,
  onChange,
  size = 'md',
}: CommentRatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const activeRating = interactive && hoverRating !== null ? hoverRating : (rating ?? 0);

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex items-center gap-1"
        role={interactive ? 'radiogroup' : undefined}
        aria-label={interactive ? 'Rate this article out of 5 stars' : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          return (
            <button
              key={star}
              type={interactive ? 'button' : undefined}
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`${
                interactive
                  ? 'cursor-pointer p-2 rounded transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                  : 'cursor-default pointer-events-none'
              }`}
              aria-label={interactive ? `${star} star${star > 1 ? 's' : ''}` : undefined}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : 'text-muted-foreground/30 fill-transparent'
                }`}
              />
            </button>
          );
        })}
        {interactive && activeRating > 0 && (
          <span className="ml-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {ratingLabels[activeRating] || `${activeRating}/5`}
          </span>
        )}
      </div>
    </div>
  );
}
