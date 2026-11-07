import { Star } from 'lucide-react';

import { cn } from '@multi-site-cms/ui';

const SIZES = { sm: 'size-3.5', md: 'size-4', lg: 'size-5' } as const;

interface RatingStarsProps {
  readonly rating: number;
  readonly size?: keyof typeof SIZES;
  readonly className?: string;
}

/** Read-only stars, announced once as "Rated 4 out of 5" instead of five icons. */
export function RatingStars({ rating, size = 'md', className }: RatingStarsProps) {
  const rounded = Math.round(rating);
  return (
    <span
      role="img"
      aria-label={`Rated ${rating} out of 5`}
      className={cn('inline-flex items-center gap-0.5', className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            SIZES[size],
            star <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-border',
          )}
        />
      ))}
    </span>
  );
}
