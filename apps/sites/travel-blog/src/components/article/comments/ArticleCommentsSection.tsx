'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageSquareText, PenLine, X } from 'lucide-react';

import type {
  PublicCommentItem,
  PublicCommentsResult,
  SubmittedPublicComment,
} from '@multi-site-cms/types';

import { addRating, summaryFromResult, type RatingSummary } from '@/lib/review';

import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { RatingSummaryCard } from './RatingSummaryCard';

interface ArticleCommentsSectionProps {
  readonly slug: string;
  readonly initialData: PublicCommentsResult;
}

type Outcome = 'approved' | 'pending' | null;

const FORM_ID = 'review-form';

/**
 * Reader reviews: the rating summary and the reviews come first, because that
 * is what most visitors came for; writing one is a deliberate step behind a
 * button, so the form never pushes the content down the page. A published review
 * appears at once and updates the summary; a pending one is acknowledged with a
 * message that says what happens next.
 */
export function ArticleCommentsSection({ slug, initialData }: ArticleCommentsSectionProps) {
  const [comments, setComments] = useState<PublicCommentItem[]>(initialData.items);
  const [summary, setSummary] = useState<RatingSummary>(() => summaryFromResult(initialData));
  const [formOpen, setFormOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (outcome) outcomeRef.current?.focus();
  }, [outcome]);

  const handleSubmitted = (comment: SubmittedPublicComment) => {
    setFormOpen(false);
    if (comment.status === 'approved') {
      setComments((current) => [comment, ...current]);
      setSummary((current) => addRating(current, comment.rating));
      setOutcome('approved');
    } else {
      setOutcome('pending');
    }
  };

  const openForm = () => {
    setOutcome(null);
    setFormOpen(true);
  };

  return (
    <section
      id="reader-comments"
      aria-labelledby="comments-heading"
      className="scroll-mt-24 space-y-6 border-t border-border/80 pt-10 sm:pt-14"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="comments-heading"
            className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Reader reviews
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Experiences and tips from readers of this story.
          </p>
        </div>

        {!formOpen && (
          <button
            type="button"
            onClick={openForm}
            aria-expanded={false}
            aria-controls={FORM_ID}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
          >
            <PenLine aria-hidden="true" className="size-4" />
            Write a review
          </button>
        )}
      </div>

      {outcome && (
        <div
          ref={outcomeRef}
          tabIndex={-1}
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm outline-hidden sm:p-5"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-bold text-foreground">
              {outcome === 'approved'
                ? 'Thank you! Your review is live.'
                : 'Thank you for your review.'}
            </p>
            <p className="text-muted-foreground">
              {outcome === 'approved'
                ? 'It now appears in the list below.'
                : 'It will appear here once it has been checked.'}
            </p>
          </div>
        </div>
      )}

      {formOpen && (
        <div id={FORM_ID} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-foreground">Write your review</h3>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X aria-hidden="true" className="size-4" />
              Cancel
            </button>
          </div>
          <CommentForm slug={slug} onSubmitted={handleSubmitted} />
        </div>
      )}

      <RatingSummaryCard summary={summary} />

      {comments.length > 0 ? (
        <CommentList comments={comments} />
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquareText aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-4 font-serif text-xl font-bold text-foreground">No reviews yet</h3>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Been here, or planning a trip? Be the first to share what you found.
          </p>
        </div>
      )}
    </section>
  );
}
