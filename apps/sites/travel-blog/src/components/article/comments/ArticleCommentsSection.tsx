'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import type { PublicCommentItem, PublicCommentsResult } from '@multi-site-cms/types';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';

interface ArticleCommentsSectionProps {
  slug: string;
  initialData?: PublicCommentsResult | null;
}

export function ArticleCommentsSection({ slug, initialData }: ArticleCommentsSectionProps) {
  const [comments, setComments] = useState<PublicCommentItem[]>(initialData?.items ?? []);
  const [total, setTotal] = useState<number>(initialData?.total ?? 0);
  const [averageRating, setAverageRating] = useState<number | null>(
    initialData?.averageRating ?? null,
  );

  useEffect(() => {
    // If not supplied via server props, fetch client-side
    if (!initialData) {
      fetch(`/api/articles/${encodeURIComponent(slug)}/comments`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: PublicCommentsResult | null) => {
          if (data) {
            setComments(data.items || []);
            setTotal(data.total || 0);
            setAverageRating(data.averageRating || null);
          }
        })
        .catch(() => {
          // silently handle
        });
    }
  }, [slug, initialData]);

  const handleCommentSubmitted = (newComment: PublicCommentItem) => {
    setComments((prev) => [newComment, ...prev]);
    setTotal((prev) => prev + 1);

    if (newComment.rating) {
      setAverageRating((prev) => {
        if (!prev) return newComment.rating ?? null;
        const newAvg = (prev * total + (newComment.rating ?? 5)) / (total + 1);
        return Math.round(newAvg * 10) / 10;
      });
    }
  };

  return (
    <section
      id="reader-comments"
      className="border-t border-border/80 pt-10 sm:pt-14 space-y-10"
      aria-labelledby="comments-heading"
    >
      {/* Section Header & Rating Highlights */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 id="comments-heading" className="font-serif text-2xl font-bold text-foreground">
              Reader Reflections
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real traveler advice, experiences, and queries
            </p>
          </div>
        </div>

        {/* Aggregate Star Badge */}
        {averageRating !== null && averageRating > 0 && (
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">/ 5.0</span>
            <span className="text-xs text-muted-foreground">
              ({total} {total === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm slug={slug} onCommentSubmitted={handleCommentSubmitted} />

      {/* Comments List */}
      <CommentList comments={comments} />
    </section>
  );
}
