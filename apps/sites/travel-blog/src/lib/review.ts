import type { PublicCommentsResult, RatingBreakdown } from '@multi-site-cms/types';

/** Mirrors the API's limits so a reader is told before the server has to refuse. */
export const REVIEW_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 255 },
  content: { min: 3, max: 1000 },
} as const;

export interface ReviewDraft {
  readonly name: string;
  readonly email: string;
  readonly content: string;
}

export type ReviewErrors = Partial<Record<keyof ReviewDraft, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field-level problems for a draft review; an empty object means it can be sent. */
export function validateReview(draft: ReviewDraft): ReviewErrors {
  const errors: ReviewErrors = {};
  const name = draft.name.trim();
  const email = draft.email.trim();
  const content = draft.content.trim();

  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length < REVIEW_LIMITS.name.min) {
    errors.name = `Your name needs at least ${REVIEW_LIMITS.name.min} characters.`;
  }

  if (!email) errors.email = 'Please enter your email address.';
  else if (!EMAIL.test(email) || email.length > REVIEW_LIMITS.email.max) {
    errors.email = 'That email address does not look right.';
  }

  if (!content) errors.content = 'Please write a few words about the story or the place.';
  else if (content.length < REVIEW_LIMITS.content.min) {
    errors.content = `Your review needs at least ${REVIEW_LIMITS.content.min} characters.`;
  }

  return errors;
}

const RATING_LABELS: Readonly<Record<number, string>> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

/** Plain-language name of a star rating, or an empty string when there is none. */
export function ratingLabel(stars: number | null): string {
  return stars ? (RATING_LABELS[stars] ?? '') : '';
}

/** What the rating summary shows: the average, how many ratings it rests on, and the spread. */
export interface RatingSummary {
  readonly average: number | null;
  readonly count: number;
  readonly breakdown: RatingBreakdown;
}

export const EMPTY_BREAKDOWN: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

export function summaryFromResult(result: PublicCommentsResult): RatingSummary {
  return {
    average: result.averageRating,
    count: result.ratingCount,
    breakdown: result.ratingBreakdown,
  };
}

/** The summary after one more star rating is published, recomputed from the breakdown. */
export function addRating(summary: RatingSummary, stars: number | null): RatingSummary {
  if (!stars || stars < 1 || stars > 5) return summary;
  const key = stars as keyof RatingBreakdown;
  const breakdown: RatingBreakdown = { ...summary.breakdown, [key]: summary.breakdown[key] + 1 };
  const count = summary.count + 1;
  const sum = ([1, 2, 3, 4, 5] as const).reduce((acc, star) => acc + star * breakdown[star], 0);
  return { average: Math.round((sum / count) * 10) / 10, count, breakdown };
}
