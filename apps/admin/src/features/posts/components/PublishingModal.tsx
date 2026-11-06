'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Loader2,
  RotateCcw,
  Archive,
  RefreshCw,
} from 'lucide-react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import { useAdmin } from '@/lib/admin-context';
import {
  useArchivePublicationMutation,
  useCancelScheduleMutation,
  usePublishImmediatelyMutation,
  useReschedulePublicationMutation,
  useUpdateLiveContentMutation,
  useRestorePublicationMutation,
  useSchedulePublicationMutation,
  useUnpublishPublicationMutation,
} from '@/lib/cms-api';

export type PublishingActionType =
  | 'publish'
  | 'updateLive'
  | 'schedule'
  | 'reschedule'
  | 'cancelSchedule'
  | 'unpublish'
  | 'archive'
  | 'restore';

interface PublishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: PublishingActionType;
  publication: PostPublicationItem;
  postTitle?: string;
  onSuccess?: () => void;
}

export function PublishingModal({
  isOpen,
  onClose,
  action,
  publication,
  postTitle,
  onSuccess,
}: PublishingModalProps) {
  const { t, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  // Form states
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mutations
  const [publishImmediately, { isLoading: isPublishing }] = usePublishImmediatelyMutation();
  const [updateLiveContent, { isLoading: isUpdatingLive }] = useUpdateLiveContentMutation();
  const [schedulePublication, { isLoading: isScheduling }] = useSchedulePublicationMutation();
  const [reschedulePublication, { isLoading: isRescheduling }] = useReschedulePublicationMutation();
  const [cancelSchedule, { isLoading: isCancelling }] = useCancelScheduleMutation();
  const [unpublishPublication, { isLoading: isUnpublishing }] = useUnpublishPublicationMutation();
  const [archivePublication, { isLoading: isArchiving }] = useArchivePublicationMutation();
  const [restorePublication, { isLoading: isRestoring }] = useRestorePublicationMutation();

  const isPending =
    isPublishing ||
    isUpdatingLive ||
    isScheduling ||
    isRescheduling ||
    isCancelling ||
    isUnpublishing ||
    isArchiving ||
    isRestoring;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const siteId = publication.siteId;
    const publicationId = publication.id;

    try {
      if (action === 'publish') {
        await publishImmediately({ siteId, publicationId }).unwrap();
      } else if (action === 'updateLive') {
        await updateLiveContent({ siteId, publicationId }).unwrap();
      } else if (action === 'schedule') {
        if (!scheduledTime) {
          setErrorMsg('Please select a scheduled date and time.');
          return;
        }
        const dateObj = new Date(scheduledTime);
        if (dateObj.getTime() <= Date.now() + 5000) {
          setErrorMsg(t.publishing.invalidTimeError);
          return;
        }
        await schedulePublication({
          siteId,
          publicationId,
          data: {
            scheduledFor: dateObj.toISOString(),
            reason: reason.trim() || undefined,
          },
        }).unwrap();
      } else if (action === 'reschedule') {
        if (!scheduledTime) {
          setErrorMsg('Please select a new date and time.');
          return;
        }
        const dateObj = new Date(scheduledTime);
        if (dateObj.getTime() <= Date.now() + 5000) {
          setErrorMsg(t.publishing.invalidTimeError);
          return;
        }
        await reschedulePublication({
          siteId,
          publicationId,
          data: {
            scheduledFor: dateObj.toISOString(),
            reason: reason.trim() || undefined,
          },
        }).unwrap();
      } else if (action === 'cancelSchedule') {
        await cancelSchedule({
          siteId,
          publicationId,
          data: { reason: reason.trim() || undefined },
        }).unwrap();
      } else if (action === 'unpublish') {
        await unpublishPublication({
          siteId,
          publicationId,
          data: { reason: reason.trim() || undefined },
        }).unwrap();
      } else if (action === 'archive') {
        await archivePublication({
          siteId,
          publicationId,
          data: { reason: reason.trim() || undefined },
        }).unwrap();
      } else if (action === 'restore') {
        await restorePublication({ siteId, publicationId }).unwrap();
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Operation failed.');
    }
  };

  // Content configurations per action
  const config = {
    publish: {
      title: t.publishing.publishTitle,
      description: t.publishing.publishDesc,
      icon: Send,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
      btnText: t.actions.publishNow,
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      isDestructive: false,
    },
    updateLive: {
      title: 'Update the live site',
      description:
        'Replace the published version on this site with your latest saved edits. The URL and publish date stay the same.',
      icon: RefreshCw,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
      btnText: 'Update live',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      isDestructive: false,
    },
    schedule: {
      title: t.publishing.scheduleTitle,
      description: t.publishing.scheduleDesc,
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
      btnText: t.actions.schedule,
      btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      isDestructive: false,
    },
    reschedule: {
      title: 'Reschedule Publication',
      description: 'Update the planned release timestamp for this scheduled item.',
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
      btnText: t.actions.reschedule,
      btnClass: 'bg-purple-600 hover:bg-purple-700 text-white',
      isDestructive: false,
    },
    cancelSchedule: {
      title: t.publishing.cancelScheduleTitle,
      description: t.publishing.cancelScheduleDesc,
      icon: RotateCcw,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
      btnText: t.actions.cancelSchedule,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      isDestructive: true,
    },
    unpublish: {
      title: t.publishing.unpublishTitle,
      description: t.publishing.unpublishDesc,
      icon: AlertTriangle,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30',
      btnText: t.actions.unpublish,
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
      isDestructive: true,
    },
    archive: {
      title: t.publishing.archiveTitle,
      description: t.publishing.archiveDesc,
      icon: Archive,
      color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
      btnText: t.actions.archive,
      btnClass: 'bg-slate-800 hover:bg-slate-900 text-white',
      isDestructive: true,
    },
    restore: {
      title: t.publishing.restoreTitle,
      description: t.publishing.restoreDesc,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
      btnText: t.actions.restore,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      isDestructive: false,
    },
  }[action];

  const Icon = config.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2.5 rounded-xl shrink-0 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
              {config.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Target Post Context */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 mb-4 text-xs border border-slate-100 dark:border-slate-700/60">
          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
            {postTitle || publication.slug}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Slug: /{publication.slug}</span>
            <span>•</span>
            <span className="capitalize">Status: {publication.status}</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Scheduling inputs */}
          {(action === 'schedule' || action === 'reschedule') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.publishing.targetTime}
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Configured site timezone: <span className="font-semibold">{timezone}</span>
              </p>
            </div>
          )}

          {/* Optional Reason Input for cancellation / unpublishing / scheduling */}
          {(action === 'schedule' ||
            action === 'reschedule' ||
            action === 'cancelSchedule' ||
            action === 'unpublish' ||
            action === 'archive') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.publishing.reasonOptional}
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief editorial justification for audit log..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Destructive Warning */}
          {config.isDestructive && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>
                This state change will be recorded in the immutable audit log and trigger immediate
                cache invalidation.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50 ${config.btnClass}`}
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{config.btnText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
