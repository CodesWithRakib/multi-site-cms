'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2, Plus, ArrowRight } from 'lucide-react';
import { useUploadMediaMutation } from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';
import { MediaDropzoneQueueItem, type QueueItem } from './MediaDropzoneQueueItem';

export interface MediaDropzoneProps {
  siteId?: string;
  onUploaded?: (asset: MediaAssetItem) => void;
  onFinishedAll?: () => void;
}

export function MediaDropzone({ siteId, onUploaded, onFinishedAll }: MediaDropzoneProps) {
  const [uploadMedia] = useUploadMediaMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setGeneralError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralError(null);
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: QueueItem[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || file.type.startsWith('audio/');
      const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        setGeneralError(`Skipped ${file.name}: file exceeds size limit.`);
        continue;
      }

      const suggestedAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        altText: suggestedAlt,
        caption: '',
        status: 'idle',
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleUpdateAltText = (id: string, text: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, altText: text } : q)));
  };

  const handleUpdateCaption = (id: string, text: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, caption: text } : q)));
  };

  const handleRemove = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUploadAll = async () => {
    const pendingItems = queue.filter((q) => q.status !== 'success');
    if (pendingItems.length === 0) return;

    setIsUploadingAll(true);
    setGeneralError(null);
    let successful = 0;

    for (const item of pendingItems) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', error: undefined } : q)),
      );

      const formData = new FormData();
      formData.append('file', item.file);
      if (siteId) formData.append('siteId', siteId);
      if (item.altText.trim()) formData.append('altText', item.altText.trim());
      if (item.caption.trim()) formData.append('caption', item.caption.trim());

      try {
        const result = await uploadMedia(formData).unwrap();
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q)),
        );
        successful++;
        if (onUploaded) onUploaded(result.media);
      } catch (err: unknown) {
        const errObj = err as { message?: string; data?: { error?: { message?: string } } };
        const msg = errObj?.data?.error?.message || errObj?.message || 'Upload failed.';
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: msg } : q)),
        );
      }
    }

    setSuccessCount((prev) => prev + successful);
    setIsUploadingAll(false);
  };

  const pendingCount = queue.filter((q) => q.status !== 'success').length;

  return (
    <div className="space-y-4">
      {/* Drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-inner ring-4 ring-emerald-500/10'
            : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,application/pdf,video/mp4"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
            Drag & drop media files here, or click to browse
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select one or multiple images, PDFs (up to 15MB) or videos (up to 50MB)
          </p>
        </div>
      </div>

      {generalError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Upload Queue List */}
      {queue.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Upload Queue ({queue.length} {queue.length === 1 ? 'file' : 'files'})
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAll}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add More</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {queue.map((item) => (
              <MediaDropzoneQueueItem
                key={item.id}
                item={item}
                onUpdateAltText={handleUpdateAltText}
                onUpdateCaption={handleUpdateCaption}
                onRemove={handleRemove}
                disabled={isUploadingAll}
              />
            ))}
          </div>

          {/* Queue Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              {successCount > 0 ? `${successCount} uploaded successfully` : 'Review metadata before uploading'}
            </span>

            <div className="flex items-center gap-2">
              {successCount > 0 && onFinishedAll && (
                <button
                  type="button"
                  onClick={onFinishedAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Done
                </button>
              )}

              <button
                type="button"
                onClick={handleUploadAll}
                disabled={pendingCount === 0 || isUploadingAll}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] font-bold rounded-xl hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {isUploadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {isUploadingAll
                    ? 'Uploading Queue...'
                    : `Upload All (${pendingCount} ${pendingCount === 1 ? 'file' : 'files'})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
