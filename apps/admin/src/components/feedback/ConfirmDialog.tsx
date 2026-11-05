'use client';

import type { ReactNode } from 'react';
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

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: ReactNode;
  readonly confirmLabel: string;
  readonly busyLabel?: string;
  readonly cancelLabel?: string;
  /** `danger` for destructive actions. */
  readonly tone?: 'danger' | 'default';
  readonly isBusy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Accessible confirmation (replaces native `confirm()`). Cancel receives focus
 * first, so Enter never confirms a destructive action by accident; the dialog
 * stays open while the action runs.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !isBusy && onCancel()}>
      <AlertDialogContent className="rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isBusy}
            onClick={(event) => {
              // Keep the dialog open until the request settles.
              event.preventDefault();
              onConfirm();
            }}
            className={
              tone === 'danger'
                ? 'bg-rose-700 text-white hover:bg-rose-800 focus-visible:outline-rose-700'
                : undefined
            }
          >
            {isBusy ? (busyLabel ?? `${confirmLabel}…`) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
