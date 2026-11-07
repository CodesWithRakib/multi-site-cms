'use client';

import React from 'react';
import { useAdmin } from '@/lib/admin-context';
import { Check, ShieldAlert, XCircle, Trash2, ExternalLink, Mail, Star, Globe } from 'lucide-react';
import type { AdminCommentItem, CommentStatus } from '@multi-site-cms/types';

interface CommentModerationCardProps {
  comment: AdminCommentItem;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onUpdateStatus: (id: string, status: CommentStatus) => void;
  onDelete: (id: string) => void;
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

function getStatusBadge(status: CommentStatus) {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        className:
          'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      };
    case 'pending':
      return {
        label: 'Pending Review',
        className:
          'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-500/30',
      };
    case 'spam':
      return {
        label: 'Flagged Spam',
        className: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-500/30',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        className:
          'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400 border-border',
      };
  }
}

export function CommentModerationCard({
  comment,
  isSelected,
  onSelectToggle,
  onUpdateStatus,
  onDelete,
}: CommentModerationCardProps) {
  const { can } = useAdmin();
  const canDelete = can('post:delete');
  const initials = getInitials(comment.authorName);
  const statusBadge = getStatusBadge(comment.status);
  const formattedDate = new Date(comment.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Calculate live preview URL based on site key
  const isTravel = comment.siteKey.includes('travel');
  const sitePort = isTravel ? '5001' : '5002';
  const publicArticleUrl = `http://localhost:${sitePort}/articles/${comment.publicationSlug}`;

  return (
    <div
      className={`group relative rounded-2xl border p-4 sm:p-5 transition ${
        isSelected
          ? 'border-emerald-500 bg-emerald-500/[0.03] shadow-xs'
          : 'border-border/80 bg-card hover:border-border'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Selection Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelectToggle(comment.id)}
            aria-label={`Select comment by ${comment.authorName}`}
            className="h-4 w-4 rounded border-border text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
          />
        </div>

        {/* Author Avatar */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-xs font-bold text-white shadow-xs"
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-foreground text-sm sm:text-base">
                {comment.authorName}
              </h4>
              <a
                href={`mailto:${comment.authorEmail}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 transition-colors"
                title={`Email ${comment.authorEmail}`}
              >
                <Mail className="h-3 w-3" />
                <span>{comment.authorEmail}</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
            </div>
          </div>

          {/* Article and Site Context */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <Globe className="h-3 w-3" />
              {comment.siteName}
            </span>
            <span>•</span>
            <span className="font-medium text-foreground truncate max-w-xs sm:max-w-md">
              On: {comment.publicationTitle}
            </span>
            {comment.publicationSlug && (
              <a
                href={publicArticleUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 hover:underline text-[11px]"
              >
                <span>View</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {typeof comment.rating === 'number' && comment.rating > 0 && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {comment.rating} / 5
                </span>
              </>
            )}
          </div>

          {/* Comment Content */}
          <div className="mt-3 rounded-xl bg-muted/40 p-3.5 text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed border border-border/40">
            {comment.content}
          </div>

          {/* Quick Moderation Actions */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="text-[11px] text-muted-foreground">
              ID: <span className="font-mono text-[10px]">{comment.id.slice(0, 8)}...</span>
            </div>

            <div className="flex items-center gap-1.5">
              {comment.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(comment.id, 'approved')}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
              )}

              {comment.status !== 'spam' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(comment.id, 'spam')}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-card px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Spam</span>
                </button>
              )}

              {comment.status !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(comment.id, 'rejected')}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  aria-label="Delete comment permanently"
                  title="Delete comment permanently"
                  className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
