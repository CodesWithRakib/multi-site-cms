'use client';

import React, { useState } from 'react';
import { Search, Loader2, ChevronLeft, ChevronRight, Upload, Grid } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { MediaCard, MediaDropzone } from '@/features/media';
import { useDeleteMediaMutation, useListMediaQuery } from '@/lib/cms-api';

export default function MediaPage() {
  const { t, activeSiteId, activeSite } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  const {
    data: mediaData,
    isLoading,
    refetch,
  } = useListMediaQuery({
    siteId: activeSiteId || undefined,
    search: searchTerm.trim() || undefined,
    mimeType: mimeFilter || undefined,
    page,
    limit: 20,
  });

  const [deleteMedia] = useDeleteMediaMutation();

  const handleDelete = async (id: string) => {
    if (confirm(t.media.deleteConfirm)) {
      try {
        await deleteMedia(id).unwrap();
        refetch();
      } catch (err: unknown) {
        const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
        alert(
          'Failed to delete asset: ' +
            (errorObj?.data?.error?.message || errorObj?.message || 'Media is currently in use.'),
        );
      }
    }
  };

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.media.title}
              </h1>
              {activeSite && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {activeSite.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.media.subtitle}</p>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'browse'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Browse Library</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.media.uploadTitle}</span>
            </button>
          </div>
        </div>

        {activeTab === 'upload' ? (
          <div className="max-w-2xl mx-auto py-6 w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-sm font-bold mb-1 text-slate-900 dark:text-slate-100">
              {t.media.uploadTitle}
            </h2>
            <p className="text-xs text-slate-500 mb-4">{t.media.supportedFormats}</p>
            <MediaDropzone
              onUploaded={() => {
                setActiveTab('browse');
                refetch();
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t.actions.search}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-48">
                <select
                  value={mimeFilter}
                  onChange={(e) => {
                    setMimeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Formats</option>
                  <option value="image/">Images (JPG, PNG, WebP, SVG)</option>
                  <option value="application/pdf">PDF Documents</option>
                  <option value="video/">Videos (MP4)</option>
                </select>
              </div>
            </div>

            {/* Asset Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-semibold">Loading media library...</span>
              </div>
            ) : mediaData?.items && mediaData.items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaData.items.map((asset) => (
                  <MediaCard key={asset.id} asset={asset} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  No media assets found
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Upload destination photography, live event banners, or documents.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
                >
                  Upload First Asset
                </button>
              </div>
            )}

            {/* Pagination */}
            {mediaData && mediaData.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs text-slate-500">
                <span>
                  Page {mediaData.page} of {mediaData.totalPages} ({mediaData.total} assets)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= mediaData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
