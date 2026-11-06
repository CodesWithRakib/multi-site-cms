'use client';

import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, ShieldCheck, X, Loader2 } from 'lucide-react';
import type { JSONContent } from '@tiptap/react';
import { ReadOnlyDocument } from '@/features/editor';
import { useGeneratePreviewTokenMutation, useGetPostPreviewQuery } from '@/lib/cms-api';

/** What is in the editor right now, including unsaved changes. */
export interface PostPreviewDraft {
  title: string;
  excerpt: string;
  body: JSONContent;
}

export interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  siteId?: string;
  draft?: PostPreviewDraft;
}

const hasBlocks = (doc: JSONContent | undefined): doc is JSONContent =>
  Array.isArray(doc?.content) && doc.content.length > 0;

export function PostPreviewModal({
  isOpen,
  onClose,
  postId,
  siteId,
  draft,
}: PostPreviewModalProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [generateToken, { data: tokenData, isLoading: isTokenLoading }] =
    useGeneratePreviewTokenMutation();

  useEffect(() => {
    if (isOpen && postId) {
      void generateToken({ postId, siteId });
    }
  }, [isOpen, postId, siteId, generateToken]);

  const token = tokenData?.token || '';
  const { data: previewData, isLoading: isPreviewLoading } = useGetPostPreviewQuery(
    { postId, token, siteId },
    { skip: !token || !isOpen },
  );

  if (!isOpen) return null;

  const isLoading = isTokenLoading || isPreviewLoading;
  const isAirSports =
    previewData?.site?.key === 'air-sports' || previewData?.post.type === 'air_sports_update';

  // Prefer the editor's current content so unsaved edits are previewed too;
  // fall back to the last saved revision.
  const title = draft?.title || previewData?.revision?.title || 'Untitled Post';
  const excerpt = draft?.excerpt || previewData?.revision?.excerpt;
  const savedBody = previewData?.revision?.body as JSONContent | undefined;
  const body = hasBlocks(draft?.body) ? draft.body : savedBody;
  const siteName = previewData?.site?.name ?? (isAirSports ? 'Air Sports' : 'Travel Blog');

  // Derive preview container width
  const containerWidthClass =
    device === 'mobile' ? 'max-w-[375px]' : device === 'tablet' ? 'max-w-[768px]' : 'max-w-4xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="flex flex-col bg-slate-900 text-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] border border-slate-800 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-200">Post Draft Preview</span>

            {/* Device Switcher */}
            <div className="flex p-0.5 rounded-lg bg-slate-800 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setDevice('desktop')}
                className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-slate-700 text-white shadow-xs' : 'hover:text-white'}`}
                title="Desktop (100%)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('tablet')}
                className={`p-1.5 rounded-md ${device === 'tablet' ? 'bg-slate-700 text-white shadow-xs' : 'hover:text-white'}`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDevice('mobile')}
                className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-slate-700 text-white shadow-xs' : 'hover:text-white'}`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Security Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>noindex, nofollow active (15m token)</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40 flex justify-center">
          <div
            className={`w-full ${containerWidthClass} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-300 min-h-full`}
          >
            {/* Simulated Target Site Navigation Header */}
            <div
              className={`px-6 py-4 flex items-center justify-between border-b ${
                isAirSports
                  ? 'bg-amber-500 text-slate-950 font-black tracking-wider uppercase text-sm'
                  : 'bg-slate-900 text-white font-serif text-lg font-bold'
              }`}
            >
              <span>{siteName}</span>
              <span className="text-xs font-sans font-medium opacity-80">
                {previewData?.site?.primaryDomain || 'preview.internal'}
              </span>
            </div>

            {/* Content Body */}
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs">Authenticating and compiling preview snapshot...</p>
              </div>
            ) : (
              <div className="p-6 sm:p-10 flex flex-col">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {previewData?.post.type || 'article'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Draft Revision #{previewData?.revision.revisionNumber || 1}
                  </span>
                  {previewData?.publication && (
                    <>
                      <span className="text-slate-500 dark:text-slate-400">•</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Slug: /{previewData.publication.slug}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-slate-100">
                  {title}
                </h1>

                {excerpt && (
                  <p className="text-lg text-slate-600 dark:text-slate-300 italic mb-8 border-l-4 border-slate-300 dark:border-slate-700 pl-4 py-1">
                    {excerpt}
                  </p>
                )}

                {hasBlocks(body) ? (
                  <ReadOnlyDocument
                    content={body}
                    contentType={previewData?.post.type}
                    className="text-slate-800 dark:text-slate-200"
                  />
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No body content written yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
