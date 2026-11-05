'use client';

import { useState } from 'react';
import { Search, Filter, Loader2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import { useDeleteMediaMutation, useListMediaQuery } from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';
import { MediaCard } from './MediaCard';
import { MediaDropzone } from './MediaDropzone';

export interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (asset: MediaAssetItem) => void;
  siteId?: string;
  title?: string;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectMedia,
  siteId,
  title = 'Media Library',
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: mediaData, isLoading } = useListMediaQuery(
    {
      siteId,
      search: searchTerm.trim() || undefined,
      mimeType: mimeFilter || undefined,
      page,
      limit: 12,
    },
    { skip: !isOpen },
  );

  const [deleteMedia, { isLoading: isDeleting }] = useDeleteMediaMutation();

  if (!isOpen) return null;

  const handleSelect = (asset: MediaAssetItem) => {
    onSelectMedia(asset);
    onClose();
  };

  /** Step 1: ask (ConfirmDialog below). */
  const handleDelete = (id: string) => {
    setDeleteError(null);
    setPendingDeleteId(id);
  };

  /** Step 2: confirmed. */
  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await deleteMedia(pendingDeleteId).unwrap();
    } catch (err: unknown) {
      setDeleteError(
        apiErrorMessage(err, 'The media item could not be deleted; it may be in use.'),
      );
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full h-[85vh] border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'browse'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Browse Assets
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Upload New
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            <div className="max-w-xl mx-auto py-6">
              <MediaDropzone
                siteId={siteId}
                onUploaded={(newAsset) => {
                  handleSelect(newAsset);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              {deleteError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
                >
                  {deleteError}
                </p>
              )}
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by filename or alt text..."
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <select
                    value={mimeFilter}
                    onChange={(e) => {
                      setMimeFilter(e.target.value);
                      setPage(1);
                    }}
                    className="text-xs px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">All Formats</option>
                    <option value="image/">Images Only</option>
                    <option value="application/pdf">PDF Documents</option>
                    <option value="video/">Videos</option>
                  </select>
                </div>
              </div>

              {/* Grid */}
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center py-20 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : mediaData?.items && mediaData.items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaData.items.map((asset) => (
                    <MediaCard
                      key={asset.id}
                      asset={asset}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-sm">No media assets found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload files or adjust your search filter
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Upload Asset
                  </button>
                </div>
              )}

              {/* Pagination */}
              {mediaData && mediaData.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 mt-auto text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Page {mediaData.page} of {mediaData.totalPages} ({mediaData.total} total)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 border rounded-md disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={page >= mediaData.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 border rounded-md disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this media item?"
        description="It is removed from the library. Items still used by a post cannot be deleted."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
