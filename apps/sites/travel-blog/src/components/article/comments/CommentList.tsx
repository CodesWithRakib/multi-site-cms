'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import type { PublicCommentItem } from '@multi-site-cms/types';

import { CommentItem } from './CommentItem';

interface CommentListProps {
  readonly comments: readonly PublicCommentItem[];
}

/** Reviews shown at first, and how many each "show more" adds. */
const FIRST_BATCH = 5;
const NEXT_BATCH = 10;

/** Newest first. A long thread is revealed in steps instead of one very long page. */
export function CommentList({ comments }: CommentListProps) {
  const [visible, setVisible] = useState(FIRST_BATCH);
  const shown = comments.slice(0, visible);
  const remaining = comments.length - shown.length;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-foreground">
          {comments.length} {comments.length === 1 ? 'review' : 'reviews'}
        </h3>
        <span className="text-xs text-muted-foreground">Newest first</span>
      </div>

      <ul className="space-y-3">
        {shown.map((comment) => (
          <li key={comment.id}>
            <CommentItem comment={comment} />
          </li>
        ))}
      </ul>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisible((n) => n + NEXT_BATCH)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ChevronDown aria-hidden="true" className="size-4" />
          Show {Math.min(remaining, NEXT_BATCH)} more {remaining === 1 ? 'review' : 'reviews'}
        </button>
      )}
    </div>
  );
}
