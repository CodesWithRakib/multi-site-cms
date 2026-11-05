'use client';

import React from 'react';
import { FileText, Image as ImageIcon, Trash2, Video, Check } from 'lucide-react';
import type { MediaAssetItem } from '@multi-site-cms/types';

export interface MediaCardProps {
  asset: MediaAssetItem;
  isSelected?: boolean;
  isBatchSelected?: boolean;
  onSelect?: (asset: MediaAssetItem) => void;
  onToggleBatchSelect?: (assetId: string, selected: boolean) => void;
  onDelete?: (assetId: string) => void;
}

export function MediaCard({
  asset,
  isSelected,
  isBatchSelected,
  onSelect,
  onToggleBatchSelect,
  onDelete,
}: MediaCardProps) {
  const isImage = asset.mimeType.startsWith('image/');
  const isVideo = asset.mimeType.startsWith('video/');
  const isPdf = asset.mimeType === 'application/pdf';

  const formatBytes = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10);
    if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const assetUrl = asset.url || `/api/v1/media/assets/${asset.storageKey}`;

  return (
    <div
      onClick={() => onSelect && onSelect(asset)}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all cursor-pointer ${
        isBatchSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md'
          : isSelected
            ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10 shadow-sm'
            : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* Batch Select Checkbox */}
      {onToggleBatchSelect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBatchSelect(asset.id, !isBatchSelected);
          }}
          className={`absolute top-2 left-2 z-10 size-5 rounded-md border flex items-center justify-center transition-all ${
            isBatchSelected
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-white/80 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs'
          }`}
          title="Select asset"
        >
          {isBatchSelected && <Check className="size-3.5 stroke-[3]" />}
        </button>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={assetUrl}
            alt={asset.altText || asset.originalFilename || 'Media thumbnail'}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : isVideo ? (
          <Video className="w-10 h-10 text-slate-500 dark:text-slate-400" />
        ) : isPdf ? (
          <FileText className="w-10 h-10 text-red-400" />
        ) : (
          <ImageIcon className="w-10 h-10 text-slate-500 dark:text-slate-400" />
        )}

        {asset.width && asset.height && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/60 text-white backdrop-blur-xs">
            {asset.width} × {asset.height}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-3 flex flex-col gap-1 text-xs">
        <p
          className="font-semibold text-slate-800 dark:text-slate-200 truncate"
          title={asset.originalFilename || asset.storageKey}
        >
          {asset.originalFilename || asset.storageKey.split('/').pop()}
        </p>

        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>{formatBytes(asset.byteSize)}</span>
          <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
            {asset.mimeType.split('/').pop()}
          </span>
        </div>

        {asset.altText && (
          <p
            className="text-[11px] text-slate-600 dark:text-slate-400 italic truncate"
            title={asset.altText}
          >
            Alt: {asset.altText}
          </p>
        )}
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this media asset?')) {
              onDelete(asset.id);
            }
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete Media"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
