'use client';

import React from 'react';
import { MessageSquareQuote, Sparkles } from 'lucide-react';
import type { PublicCommentItem } from '@multi-site-cms/types';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: PublicCommentItem[];
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MessageSquareQuote className="h-6 w-6" />
        </div>
        <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">
          No reflections yet
        </h4>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Be the pioneer wanderer to share your insights, recommendations, or questions on this
          dispatch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Community Reviews ({comments.length})
        </h4>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
