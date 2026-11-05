'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import type { SiteItem } from '@multi-site-cms/types';
import { useListPostsQuery, useSchedulePublicationMutation } from '@/lib/cms-api';

interface QuickScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date | null;
  availableSites: SiteItem[];
  defaultSiteId?: string;
  onSuccess: () => void;
}

function getDefaultScheduledTime(initialDate?: Date | null): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (initialDate) {
    const d = new Date(initialDate);
    d.setHours(9, 0, 0, 0);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const now = new Date(Date.now() + 3600000);
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function QuickScheduleDialog({
  isOpen,
  onClose,
  initialDate,
  availableSites,
  defaultSiteId,
  onSuccess,
}: QuickScheduleDialogProps) {
  if (!isOpen) return null;

  return (
    <QuickScheduleDialogContent
      key={`${initialDate?.getTime() || 'now'}-${defaultSiteId || 'any'}`}
      onClose={onClose}
      initialDate={initialDate}
      availableSites={availableSites}
      defaultSiteId={defaultSiteId}
      onSuccess={onSuccess}
    />
  );
}

interface DialogContentProps {
  onClose: () => void;
  initialDate?: Date | null;
  availableSites: SiteItem[];
  defaultSiteId?: string;
  onSuccess: () => void;
}

function QuickScheduleDialogContent({
  onClose,
  initialDate,
  availableSites,
  defaultSiteId,
  onSuccess,
}: DialogContentProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    defaultSiteId || availableSites[0]?.id || '',
  );
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>(() =>
    getDefaultScheduledTime(initialDate),
  );
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: postsData, isLoading: isLoadingPosts } = useListPostsQuery({
    siteId: selectedSiteId || undefined,
    limit: 100,
  });

  const [schedulePublication, { isLoading: isScheduling }] = useSchedulePublicationMutation();

  // Filter posts that have publications on selected site
  const schedulablePosts = (postsData?.items || []).filter((post) => {
    const pub = post.publications?.find((p) => p.siteId === selectedSiteId);
    return pub && pub.status !== 'archived';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPostId) {
      setErrorMsg('Please select a post to schedule.');
      return;
    }
    if (!scheduledTime) {
      setErrorMsg('Please select a valid scheduled date and time.');
      return;
    }

    const dateObj = new Date(scheduledTime);
    if (dateObj.getTime() <= Date.now() + 5000) {
      setErrorMsg('Scheduled time must be in the future.');
      return;
    }

    const post = postsData?.items?.find((p) => p.id === selectedPostId);
    const pub = post?.publications?.find((p) => p.siteId === selectedSiteId);

    if (!pub) {
      setErrorMsg('Selected post does not have a publication on this site.');
      return;
    }

    try {
      await schedulePublication({
        siteId: selectedSiteId,
        publicationId: pub.id,
        data: {
          scheduledFor: dateObj.toISOString(),
          reason: reason.trim() || undefined,
        },
      }).unwrap();

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(
        errorObj?.data?.error?.message || errorObj?.message || 'Failed to schedule post.',
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="schedule-dialog-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Schedule Article Release
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan an automated publication across your sites
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Site selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Publication Site
            </label>
            <select
              aria-label="Website"
              value={selectedSiteId}
              onChange={(e) => {
                setSelectedSiteId(e.target.value);
                setSelectedPostId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {availableSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Post selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Article / Post
            </label>
            {isLoadingPosts ? (
              <div className="p-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading available articles...</span>
              </div>
            ) : schedulablePosts.length === 0 ? (
              <p className="text-xs text-amber-600 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                No draft or schedulable articles found for this site.
              </p>
            ) : (
              <select
                aria-label="Post to schedule"
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">-- Choose an article --</option>
                {schedulablePosts.map((p) => {
                  const pub = p.publications?.find((pubItem) => pubItem.siteId === selectedSiteId);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.currentRevision?.title || p.id} ({pub?.status})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Editorial note / reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Editorial Note / Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Scheduled for weekend morning travel readership"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isScheduling}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScheduling || !selectedPostId}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
            >
              {isScheduling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Confirm Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
