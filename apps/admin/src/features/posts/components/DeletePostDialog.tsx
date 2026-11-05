'use client';

import { ConfirmDialog } from '@/components/feedback';

import type { PendingDelete } from '../hooks/usePostsWorkspace';

interface DeletePostDialogProps {
  readonly target: PendingDelete | null;
  readonly isDeleting: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirmation before deleting (archiving) a post. */
export function DeletePostDialog({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: DeletePostDialogProps) {
  return (
    <ConfirmDialog
      open={target !== null}
      title="Delete this post?"
      description={`“${target?.title ?? ''}” will be taken offline on every site it is published on and removed from this list. It is archived, not erased, and can be restored.`}
      confirmLabel="Delete post"
      busyLabel="Deleting…"
      isBusy={isDeleting}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
