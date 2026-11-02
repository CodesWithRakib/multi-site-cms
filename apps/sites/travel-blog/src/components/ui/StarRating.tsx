import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewsCount?: number | string;
  showScore?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function StarRating({
  rating,
  reviewsCount,
  showScore = true,
  className = '',
  size = 'md',
}: StarRatingProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-medium ${textSize} text-neutral-800 dark:text-neutral-200 ${className}`}
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      <Star className={`${iconSize} fill-amber-400 text-amber-400 shrink-0`} />
      {showScore && <span className="font-bold">{rating.toFixed(1)}</span>}
      {reviewsCount && (
        <span className="text-muted-foreground text-xs font-normal">
          ({typeof reviewsCount === 'number' ? `${reviewsCount.toLocaleString()} reviews` : reviewsCount})
        </span>
      )}
    </div>
  );
}

