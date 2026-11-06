'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Loader2,
  Video,
  FileText,
  Image as ImageIcon,
  Code,
} from 'lucide-react';
import type { MediaAssetItem } from '@multi-site-cms/types';
import { formatBytes } from '../utils/formatBytes';

export interface MediaDetailModalProps {
  asset: MediaAssetItem | null;
  onClose: () => void;
  onSaveMetadata: (payload: { altText: string; caption: string }) => Promise<void>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

export function MediaDetailModal({
  asset,
  onClose,
  onSaveMetadata,
  onDelete,
  isUpdating,
}: MediaDetailModalProps) {
  if (!asset) return null;

  return (
    <MediaDetailModalView
      key={asset.id}
      asset={asset}
      onClose={onClose}
      onSaveMetadata={onSaveMetadata}
      onDelete={onDelete}
      isUpdating={isUpdating}
    />
  );
}

function MediaDetailModalView({
  asset,
  onClose,
  onSaveMetadata,
  onDelete,
  isUpdating,
}: {
  asset: MediaAssetItem;
  onClose: () => void;
  onSaveMetadata: (payload: { altText: string; caption: string }) => Promise<void>;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}) {
  const [altText, setAltText] = useState(asset.altText || '');
  const [caption, setCaption] = useState(asset.caption || '');
  const [copiedKind, setCopiedKind] = useState<'url' | 'md' | 'html' | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const assetUrl = asset.url || `/api/v1/media/assets/${asset.storageKey}`;
  const isImage = asset.mimeType.startsWith('image/');
  const isVideo = asset.mimeType.startsWith('video/');
  const isPdf = asset.mimeType === 'application/pdf';

  const copyToClipboard = (text: string, kind: 'url' | 'md' | 'html') => {
    navigator.clipboard.writeText(text);
    setCopiedKind(kind);
    setTimeout(() => setCopiedKind(null), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      await onSaveMetadata({ altText: altText.trim(), caption: caption.trim() });
      setFeedback('Metadata saved successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Failed to update metadata.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          <div className="flex items-center gap-2 max-w-md truncate">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {asset.originalFilename || asset.storageKey.split('/').pop()}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {asset.mimeType}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body: Left Preview, Right Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={assetUrl}
                  alt={asset.altText || 'Media preview'}
                  className="size-full object-contain"
                />
              ) : isVideo ? (
                <Video className="size-16 text-slate-500 dark:text-slate-400" />
              ) : isPdf ? (
                <FileText className="size-16 text-rose-400" />
              ) : (
                <ImageIcon className="size-16 text-slate-500 dark:text-slate-400" />
              )}
            </div>

            {/* Quick Embed Snippets */}
            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1">
                <Code className="size-3" />
                <span>Quick Copy Embed Snippets:</span>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => copyToClipboard(assetUrl, 'url')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  {copiedKind === 'url' ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedKind === 'url' ? 'URL Copied!' : 'Copy URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `![${altText || asset.originalFilename || 'image'}](${assetUrl})`,
                      'md',
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  {copiedKind === 'md' ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedKind === 'md' ? 'Markdown Copied!' : 'Copy Markdown'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `<img src="${assetUrl}" alt="${altText.replace(/"/g, '&quot;')}" />`,
                      'html',
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-500 transition-colors cursor-pointer"
                >
                  {copiedKind === 'html' ? (
                    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedKind === 'html' ? 'HTML Copied!' : 'Copy HTML'}</span>
                </button>

                <a
                  href={assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                  title="Open original asset in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Metadata Form */}
          <form onSubmit={handleSave} className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {feedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  {feedback}
                </div>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  Dimensions:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}
                  </span>
                </div>
                <div>
                  Size:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {formatBytes(asset.byteSize)}
                  </span>
                </div>
                <div className="col-span-2 truncate">
                  Storage Key:{' '}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                    {asset.storageKey}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alt Text (Accessibility & SEO)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Descriptive text for screen readers..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Caption
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Optional visual caption or photo credits..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onDelete(asset.id);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                <span>Delete Asset</span>
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="size-3.5 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
