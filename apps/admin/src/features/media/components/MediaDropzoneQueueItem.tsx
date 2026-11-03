'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, X, FileText, Image as ImageIcon, Video } from 'lucide-react';

export interface QueueItem {
  id: string;
  file: File;
  altText: string;
  caption: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface MediaDropzoneQueueItemProps {
  item: QueueItem;
  onUpdateAltText: (id: string, text: string) => void;
  onUpdateCaption: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}

export function MediaDropzoneQueueItem({
  item,
  onUpdateAltText,
  onUpdateCaption,
  onRemove,
  disabled,
}: MediaDropzoneQueueItemProps) {
  const isImage = item.file.type.startsWith('image/');
  const isVideo = item.file.type.startsWith('video/');
  const isPdf = item.file.type === 'application/pdf';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      {/* File type icon & thumbnail indicator */}
      <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        {isImage ? (
          <ImageIcon className="size-5 text-emerald-500" />
        ) : isVideo ? (
          <Video className="size-5 text-sky-500" />
        ) : isPdf ? (
          <FileText className="size-5 text-rose-500" />
        ) : (
          <FileText className="size-5 text-slate-400" />
        )}
      </div>

      {/* Info & Inputs */}
      <div className="flex-1 min-w-0 space-y-1.5 w-full">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {item.file.name}
          </p>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {(item.file.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={item.altText}
            onChange={(e) => onUpdateAltText(item.id, e.target.value)}
            placeholder="Alt text (SEO & screen readers)..."
            disabled={disabled || item.status === 'success'}
            className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
          />
          <input
            type="text"
            value={item.caption}
            onChange={(e) => onUpdateCaption(item.id, e.target.value)}
            placeholder="Caption / photo credit (optional)..."
            disabled={disabled || item.status === 'success'}
            className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
          />
        </div>

        {item.error && (
          <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="size-3" />
            <span>{item.error}</span>
          </p>
        )}
      </div>

      {/* Status & Delete Action */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {item.status === 'uploading' && (
          <Loader2 className="size-4 animate-spin text-emerald-500" />
        )}
        {item.status === 'success' && (
          <CheckCircle2 className="size-4 text-emerald-500" />
        )}
        {item.status === 'error' && (
          <AlertCircle className="size-4 text-rose-500" />
        )}

        {item.status !== 'success' && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Remove from queue"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

