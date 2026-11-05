'use client';

import React, { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { DestinationInfoBlockAttributes } from '../extensions/destination-info-block';
import type { EventTimelineBlockAttributes } from '../extensions/event-timeline-block';
import { DestinationBlockModal } from './modals/DestinationBlockModal';
import { TimelineBlockModal } from './modals/TimelineBlockModal';
import { UrlEmbedModal } from './modals/UrlEmbedModal';

const emptySubscribe = () => () => {};

export type ActiveModalType = 'destination' | 'timeline' | 'link' | 'youtube' | null;

export interface CustomBlockModalProps {
  modalType: ActiveModalType;
  onClose: () => void;
  onInsertDestination: (attrs: DestinationInfoBlockAttributes) => void;
  onInsertTimeline: (attrs: EventTimelineBlockAttributes) => void;
  onInsertLink: (url: string) => void;
  onInsertYoutube: (url: string) => void;
}

export function CustomBlockModal({
  modalType,
  onClose,
  onInsertDestination,
  onInsertTimeline,
  onInsertLink,
  onInsertYoutube,
}: CustomBlockModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!modalType || !isClient) return null;

  const titles: Record<Exclude<ActiveModalType, null>, string> = {
    destination: 'Insert Destination Info Block',
    timeline: 'Insert Event Timeline Update',
    link: 'Add Hyperlink',
    youtube: 'Embed YouTube Video',
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {titles[modalType]}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {modalType === 'destination' && (
          <DestinationBlockModal onClose={onClose} onInsert={onInsertDestination} />
        )}

        {modalType === 'timeline' && (
          <TimelineBlockModal onClose={onClose} onInsert={onInsertTimeline} />
        )}

        {(modalType === 'link' || modalType === 'youtube') && (
          <UrlEmbedModal
            type={modalType}
            onClose={onClose}
            onSubmit={modalType === 'link' ? onInsertLink : onInsertYoutube}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
