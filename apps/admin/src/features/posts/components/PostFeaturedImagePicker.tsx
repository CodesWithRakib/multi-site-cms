'use client';

import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon, X } from 'lucide-react';
import type { MediaAssetItem } from '@multi-site-cms/types';

interface PostFeaturedImagePickerProps {
  featuredImage: MediaAssetItem | null;
  onSelectClick: () => void;
  onRemove: () => void;
}

export function PostFeaturedImagePicker({
  featuredImage,
  onSelectClick,
  onRemove,
}: PostFeaturedImagePickerProps) {
  const imageUrl = featuredImage
    ? featuredImage.url ||
      (featuredImage.storageKey.startsWith('http')
        ? featuredImage.storageKey
        : `/api/v1/media/assets/${featuredImage.storageKey}`)
    : '';

  return (
    <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Featured Image (Hero & Social Cards)
        </label>
        {featuredImage && (
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            {featuredImage.mimeType} • {featuredImage.width || 1200}×{featuredImage.height || 630}
          </span>
        )}
      </div>

      {featuredImage ? (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video max-h-72 bg-slate-100 dark:bg-slate-800">
          <Image
            src={imageUrl}
            alt={featuredImage.altText || 'Featured preview'}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSelectClick}
              className="px-3.5 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold hover:bg-white transition-colors cursor-pointer"
            >
              Change Image
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700 transition-colors cursor-pointer"
              title="Remove Featured Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {featuredImage.altText && (
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-md bg-black/70 text-white text-[11px] truncate">
              Alt: {featuredImage.altText}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelectClick}
          className="w-full flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold transition-all cursor-pointer group"
        >
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Select or Upload Featured Image
            </span>
            <span className="text-[11px] text-slate-400">
              Cloudinary CDN supported (JPG, PNG, WebP)
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

