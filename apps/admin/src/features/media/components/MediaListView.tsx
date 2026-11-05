'use client';

import React from 'react';
import { Video, FileText, Image as ImageIcon, Copy, Trash2 } from 'lucide-react';
import type { MediaAssetItem } from '@multi-site-cms/types';
import { formatBytes } from '../utils/formatBytes';

export interface MediaListViewProps {
  items: MediaAssetItem[];
  selectedBatchIds?: Set<string>;
  onToggleBatchSelect?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onSelect: (asset: MediaAssetItem) => void;
  onCopyUrl: (url: string) => void;
  onDelete: (id: string) => void;
}

export function MediaListView({
  items,
  selectedBatchIds,
  onToggleBatchSelect,
  onSelectAll,
  onSelect,
  onCopyUrl,
  onDelete,
}: MediaListViewProps) {
  const isAllSelected = items.length > 0 && items.every((i) => selectedBatchIds?.has(i.id));

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-950/50">
            {onToggleBatchSelect && (
              <th className="py-3 pl-4 pr-1 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="size-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
                  title="Select all on this page"
                />
              </th>
            )}
            <th className="py-3 px-4">Preview</th>
            <th className="py-3 px-4">File Name & Alt</th>
            <th className="py-3 px-4">MIME Type</th>
            <th className="py-3 px-4">Dimensions</th>
            <th className="py-3 px-4">File Size</th>
            <th className="py-3 px-4">Uploaded</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map((asset) => {
            const assetUrl = asset.url || `/api/v1/media/assets/${asset.storageKey}`;
            const isImage = asset.mimeType.startsWith('image/');
            const isVideo = asset.mimeType.startsWith('video/');
            const isPdf = asset.mimeType === 'application/pdf';
            const isSelected = selectedBatchIds?.has(asset.id) || false;

            return (
              <tr
                key={asset.id}
                onClick={() => onSelect(asset)}
                className={`group cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                {onToggleBatchSelect && (
                  <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onToggleBatchSelect(asset.id, e.target.checked)}
                      className="size-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                )}

                <td className="py-2.5 px-4">
                  <div className="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl}
                        alt={asset.altText || asset.originalFilename || 'Media'}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : isVideo ? (
                      <Video className="size-5 text-slate-500 dark:text-slate-400" />
                    ) : isPdf ? (
                      <FileText className="size-5 text-red-400" />
                    ) : (
                      <ImageIcon className="size-5 text-slate-500 dark:text-slate-400" />
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs">
                  <div className="truncate" title={asset.originalFilename || asset.storageKey}>
                    {asset.originalFilename || asset.storageKey.split('/').pop()}
                  </div>
                  {asset.altText && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal">
                      Alt: {asset.altText}
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-4">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {asset.mimeType}
                  </span>
                </td>

                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                  {asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}
                </td>

                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                  {formatBytes(asset.byteSize)}
                </td>

                <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </td>

                <td className="py-2.5 px-4 text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onCopyUrl(assetUrl)}
                      title="Copy URL"
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(asset.id)}
                      title="Delete Media"
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
