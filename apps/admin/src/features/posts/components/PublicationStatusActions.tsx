'use client';

import React from 'react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import type { PublishingActionType } from './PublishingModal';

interface PublicationStatusActionsProps {
  pub: PostPublicationItem;
  /** The post's newest revision; when the live publication is older, offer "Update live". */
  latestRevisionId?: string;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PublicationStatusActions({
  pub,
  latestRevisionId,
  onOpenPublishModal,
}: PublicationStatusActionsProps) {
  const isLiveOutdated =
    pub.status === 'published' && Boolean(latestRevisionId) && pub.revisionId !== latestRevisionId;
  const badgeColor =
    pub.status === 'published'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : pub.status === 'scheduled'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
        : pub.status === 'in_review'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">Live Status:</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
          {pub.status.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {pub.status !== 'published' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'publish')}
            className="px-3 py-1.5 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Publish Now
          </button>
        )}

        {pub.status === 'draft' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'schedule')}
            className="px-3 py-1.5 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Schedule
          </button>
        )}

        {pub.status === 'scheduled' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'reschedule')}
            className="px-3 py-1.5 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Reschedule
          </button>
        )}

        {isLiveOutdated && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'updateLive')}
            title="This site still shows an older version of the post"
            className="px-3 py-1.5 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Update live
          </button>
        )}

        {pub.status === 'published' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'unpublish')}
            className="px-3 py-1.5 sm:py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Unpublish
          </button>
        )}
      </div>
    </div>
  );
}
