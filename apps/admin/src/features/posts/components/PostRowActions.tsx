'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@multi-site-cms/ui';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { useAdmin } from '@/lib/admin-context';

/** Space kept free below the menu on phones: the bottom tab bar (~64 px + safe area). */
const MENU_COLLISION_PADDING = { top: 8, right: 8, left: 8, bottom: 88 };

const ITEM =
  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer';

const TONE = {
  neutral: 'text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800',
  purple: 'text-purple-700 dark:text-purple-300 focus:bg-purple-50 dark:focus:bg-purple-950/40',
  amber: 'text-amber-800 dark:text-amber-300 focus:bg-amber-50 dark:focus:bg-amber-950/40',
  danger: 'text-rose-700 dark:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/40',
  positive:
    'text-emerald-700 dark:text-emerald-300 focus:bg-emerald-50 dark:focus:bg-emerald-950/40',
} as const;

interface MenuAction {
  readonly key: string;
  readonly label: string;
  readonly icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>;
  readonly tone: keyof typeof TONE;
  readonly onSelect: () => void;
}

interface PostRowActionsProps {
  readonly postId: string;
  readonly title: string;
  readonly status: string;
  readonly publication: PostPublicationItem | undefined;
  readonly onPublishingAction: (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => void;
  readonly onSubmitForReview: (publication: PostPublicationItem) => void;
  readonly onDelete: (postId: string, title: string) => void;
}

/**
 * Edit link, quick publish, and an actions menu. The menu is a Radix dropdown:
 * keyboard navigation, focus return, Escape, outside click, and collision
 * handling (it opens upward near the phone tab bar) come from the primitive.
 */
export function PostRowActions({
  postId,
  title,
  status,
  publication: pub,
  onPublishingAction,
  onSubmitForReview,
  onDelete,
}: PostRowActionsProps) {
  const { t, can } = useAdmin();
  const editable = status === 'draft' || status === 'in_review';

  const publicationActions: MenuAction[] = pub
    ? [
        ...(status === 'draft'
          ? [
              {
                key: 'review',
                label: t.actions.submitReview,
                icon: AlertCircle,
                tone: 'amber' as const,
                onSelect: () => onSubmitForReview(pub),
              },
            ]
          : []),
        ...(editable
          ? [
              {
                key: 'schedule',
                label: t.actions.schedule,
                icon: Clock,
                tone: 'purple' as const,
                onSelect: () => onPublishingAction('schedule', pub, title),
              },
            ]
          : []),
        ...(status === 'scheduled'
          ? [
              {
                key: 'reschedule',
                label: t.actions.reschedule,
                icon: Calendar,
                tone: 'purple' as const,
                onSelect: () => onPublishingAction('reschedule', pub, title),
              },
              {
                key: 'cancel',
                label: t.actions.cancelSchedule,
                icon: RotateCcw,
                tone: 'amber' as const,
                onSelect: () => onPublishingAction('cancelSchedule', pub, title),
              },
            ]
          : []),
        ...(status === 'published'
          ? [
              {
                key: 'unpublish',
                label: t.actions.unpublish,
                icon: RotateCcw,
                tone: 'danger' as const,
                onSelect: () => onPublishingAction('unpublish', pub, title),
              },
            ]
          : []),
        status === 'archived'
          ? {
              key: 'restore',
              label: t.actions.restore,
              icon: CheckCircle2,
              tone: 'positive' as const,
              onSelect: () => onPublishingAction('restore', pub, title),
            }
          : {
              key: 'archive',
              label: t.actions.archive,
              icon: Archive,
              tone: 'neutral' as const,
              onSelect: () => onPublishingAction('archive', pub, title),
            },
      ]
    : [];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/posts/${postId}/edit`}
        className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
        title={t.actions.edit}
        aria-label={`${t.actions.edit}: ${title}`}
      >
        <Edit3 className="size-4" aria-hidden="true" />
      </Link>

      {pub && editable && (
        <button
          type="button"
          onClick={() => onPublishingAction('publish', pub, title)}
          className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title={t.actions.publishNow}
          aria-label={`${t.actions.publishNow || 'Publish'}: ${title}`}
        >
          <Send className="size-4 sm:size-3" aria-hidden="true" />
          {/* Icon-only on phones so the story title keeps its width. */}
          <span className="hidden sm:inline">{t.actions.publishNow || 'Publish'}</span>
        </button>
      )}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={`Open actions for ${title}`}
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          collisionPadding={MENU_COLLISION_PADDING}
          className="w-52 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl"
        >
          <DropdownMenuItem asChild className={`${ITEM} ${TONE.neutral}`}>
            <Link href={`/posts/${postId}/edit`}>
              <Edit3 className="size-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span>{t.actions.edit}</span>
            </Link>
          </DropdownMenuItem>

          {publicationActions.map(({ key, label, icon: Icon, tone, onSelect }) => (
            <DropdownMenuItem key={key} onSelect={onSelect} className={`${ITEM} ${TONE[tone]}`}>
              <Icon className="size-3.5" aria-hidden="true" />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}

          {can('post:delete') && (
            <>
              <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />

              <DropdownMenuItem
                onSelect={() => onDelete(postId, title)}
                className={`${ITEM} ${TONE.danger}`}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                <span>{t.actions.delete}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
