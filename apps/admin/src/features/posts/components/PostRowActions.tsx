'use client';

import { useId } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  MoreVertical,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import type { PostPublicationItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { useAdmin } from '@/lib/admin-context';

const MENU_ITEM =
  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer';

interface PostRowActionsProps {
  readonly postId: string;
  readonly title: string;
  readonly status: string;
  readonly publication: PostPublicationItem | undefined;
  readonly isMenuOpen: boolean;
  readonly onToggleMenu: () => void;
  readonly onPublishingAction: (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => void;
  readonly onSubmitForReview: (publication: PostPublicationItem) => void;
  readonly onDelete: (postId: string, title: string) => void;
}

export function PostRowActions({
  postId,
  title,
  status,
  publication: pub,
  isMenuOpen,
  onToggleMenu,
  onPublishingAction,
  onSubmitForReview,
  onDelete,
}: PostRowActionsProps) {
  const { t } = useAdmin();
  // useId: the same post renders as a table row and as a phone card.
  const menuId = useId();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center justify-end gap-1.5">
        <Link
          href={`/posts/${postId}/edit`}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
          title={t.actions.edit}
          aria-label={`${t.actions.edit}: ${title}`}
        >
          <Edit3 className="size-4" aria-hidden="true" />
        </Link>

        {pub && (status === 'draft' || status === 'in_review') && (
          <button
            type="button"
            onClick={() => onPublishingAction('publish', pub, title)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title={t.actions.publishNow}
          >
            <Send className="size-3" aria-hidden="true" />
            <span>{t.actions.publishNow || 'Publish'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMenu}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={`Open actions for ${title}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-controls={isMenuOpen ? menuId : undefined}
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </button>
      </div>

      {isMenuOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-1 w-52 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 text-left text-xs font-semibold"
        >
          <Link
            href={`/posts/${postId}/edit`}
            role="menuitem"
            className={`${MENU_ITEM} text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`}
          >
            <Edit3 className="size-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <span>{t.actions.edit}</span>
          </Link>

          {pub && (
            <>
              {status === 'draft' && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onSubmitForReview(pub)}
                  className={`${MENU_ITEM} text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800`}
                >
                  <AlertCircle
                    className="size-3.5 text-amber-700 dark:text-amber-400"
                    aria-hidden="true"
                  />
                  <span>{t.actions.submitReview}</span>
                </button>
              )}
              {(status === 'draft' || status === 'in_review') && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onPublishingAction('schedule', pub, title)}
                  className={`${MENU_ITEM} text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30`}
                >
                  <Clock className="size-3.5" aria-hidden="true" />
                  <span>{t.actions.schedule}</span>
                </button>
              )}
              {status === 'scheduled' && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => onPublishingAction('reschedule', pub, title)}
                    className={`${MENU_ITEM} text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30`}
                  >
                    <Calendar className="size-3.5" aria-hidden="true" />
                    <span>{t.actions.reschedule}</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => onPublishingAction('cancelSchedule', pub, title)}
                    className={`${MENU_ITEM} text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30`}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    <span>{t.actions.cancelSchedule}</span>
                  </button>
                </>
              )}
              {status === 'published' && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onPublishingAction('unpublish', pub, title)}
                  className={`${MENU_ITEM} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>{t.actions.unpublish}</span>
                </button>
              )}
              {status !== 'archived' ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onPublishingAction('archive', pub, title)}
                  className={`${MENU_ITEM} text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`}
                >
                  <Archive
                    className="size-3.5 text-slate-500 dark:text-slate-400"
                    aria-hidden="true"
                  />
                  <span>{t.actions.archive}</span>
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onPublishingAction('restore', pub, title)}
                  className={`${MENU_ITEM} text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30`}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  <span>{t.actions.restore}</span>
                </button>
              )}
            </>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" role="separator" />

          <button
            type="button"
            role="menuitem"
            onClick={() => onDelete(postId, title)}
            className={`${MENU_ITEM} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span>{t.actions.delete}</span>
          </button>
        </div>
      )}
    </div>
  );
}
