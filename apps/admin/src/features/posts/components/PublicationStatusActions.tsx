'use client';

import React from 'react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import type { PublishingActionType } from './PublishingModal';

interface PublicationStatusActionsProps {
  pub: PostPublicationItem;
  onOpenPublishModal: (pub: PostPublicationItem, action: PublishingActionType) => void;
}

export function PublicationStatusActions({ pub, onOpenPublishModal }: PublicationStatusActionsProps) {
  const badgeColor =
    pub.status === 'published'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      : pub.status === 'scheduled'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
        : pub.status === 'in_review'
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500">Live Status:</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
          {pub.status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {pub.status !== 'published' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'publish')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Publish Now
          </button>
        )}

        {pub.status === 'draft' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'schedule')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Schedule
          </button>
        )}

        {pub.status === 'scheduled' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'reschedule')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Reschedule
          </button>
        )}

        {pub.status === 'published' && (
          <button
            type="button"
            onClick={() => onOpenPublishModal(pub, 'unpublish')}
            className="px-3 py-1 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
          >
            Unpublish
          </button>
        )}
      </div>
    </div>
  );
}

