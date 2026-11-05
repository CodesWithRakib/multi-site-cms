'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@multi-site-cms/ui';

import type { PendingDelete } from '../hooks/usePostsWorkspace';

interface DeletePostDialogProps {
  readonly target: PendingDelete | null;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirmation before deleting a post (replaces the native `confirm()`). */
export function DeletePostDialog({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: DeletePostDialogProps) {
  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <AlertDialogContent className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-white">
            Delete this post?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
            “{target?.title}” will be taken offline on every site it is published on and removed
            from this list. It is archived, not erased, and can be restored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={(event) => {
              // Keep the dialog open until the request settles.
              event.preventDefault();
              onConfirm();
            }}
            className="bg-rose-700 text-white hover:bg-rose-800 focus-visible:outline-rose-700"
          >
            {isDeleting ? 'Deleting…' : 'Delete post'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
