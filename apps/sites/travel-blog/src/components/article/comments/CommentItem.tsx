import type { PublicCommentItem } from '@multi-site-cms/types';
import { cn } from '@multi-site-cms/ui';

import { AuthorAvatar } from '@/components/ui/AuthorAvatar';
import { formatPublishedDate } from '@/lib/format';

import { RatingStars } from './RatingStars';

interface CommentItemProps {
  readonly comment: PublicCommentItem;
  /** 0 for a review, 1+ for a reply to one. */
  readonly level?: number;
}

/**
 * One review and its replies. Stars sit under the name on phones and beside the
 * date from `sm`, so a long name never squeezes them. No badge is invented for
 * the writer: readers are shown exactly what they submitted.
 */
export function CommentItem({ comment, level = 0 }: CommentItemProps) {
  const isReply = level > 0;
  const hasRating = typeof comment.rating === 'number' && comment.rating > 0;

  return (
    <article
      aria-label={`${isReply ? 'Reply' : 'Review'} by ${comment.authorName}`}
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-4 sm:p-5',
        isReply && 'ml-4 border-l-2 border-l-primary/50 bg-muted/30 sm:ml-10',
      )}
    >
      <header className="flex items-start gap-3">
        <AuthorAvatar name={comment.authorName} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="truncate text-sm font-bold text-foreground sm:text-base">
              {comment.authorName}
            </h3>
            <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
              {formatPublishedDate(comment.createdAt)}
            </time>
          </div>
          {hasRating && comment.rating !== null && (
            <RatingStars rating={comment.rating} size="sm" className="mt-1" />
          )}
        </div>
      </header>

      <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/90 sm:pl-13">
        {comment.content}
      </p>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} level={level + 1} />
          ))}
        </div>
      )}
    </article>
  );
}
