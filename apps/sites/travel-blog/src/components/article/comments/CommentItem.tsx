'use client';

import React from 'react';
import type { PublicCommentItem } from '@multi-site-cms/types';
import { CommentRatingStars } from './CommentRatingStars';

interface CommentItemProps {
  comment: PublicCommentItem;
  level?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (parts.length >= 2 && first && last && first[0] && last[0]) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first && first.length > 0) {
    return first.slice(0, 2).toUpperCase();
  }
  return '??';
}

function formatCommentDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}

export function CommentItem({ comment, level = 0 }: CommentItemProps) {
  const initials = getInitials(comment.authorName);
  const formattedDate = formatCommentDate(comment.createdAt);

  return (
    <div
      className={`group relative rounded-2xl border border-border/60 bg-card p-5 transition-all hover:border-emerald-500/30 hover:shadow-sm ${
        level > 0 ? 'ml-6 sm:ml-12 mt-3 border-l-2 border-l-emerald-500/60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Author Avatar and Info */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-sm font-semibold text-white shadow-sm ring-2 ring-emerald-500/20"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                {comment.authorName}
              </h4>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Wanderer
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* Rating Stars */}
        {typeof comment.rating === 'number' && comment.rating > 0 && (
          <div className="shrink-0">
            <CommentRatingStars rating={comment.rating} size="sm" />
          </div>
        )}
      </div>

      {/* Comment Content */}
      <p className="mt-3.5 text-sm text-foreground/90 whitespace-pre-line leading-relaxed pl-0 sm:pl-13">
        {comment.content}
      </p>

      {/* Render Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
