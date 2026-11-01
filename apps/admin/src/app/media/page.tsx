'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Filter, Search, Loader2, ArrowRight } from 'lucide-react';
import { MediaCard, MediaDropzone } from '@/features/media';
import { useDeleteMediaMutation, useListMediaQuery } from '@/lib/cms-api';

export default function MediaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  const { data: mediaData, isLoading } = useListMediaQuery({
    search: searchTerm.trim() || undefined,
    mimeType: mimeFilter || undefined,
    page,
    limit: 16,
  });

  const [deleteMedia] = useDeleteMediaMutation();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media asset?')) {
      try {
        await deleteMedia(id).unwrap();
      } catch (err) {
        alert('Failed to delete media asset: ' + ((err as Error).message || 'Server error'));
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link
            href="/posts"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Media Asset Library
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Centralized storage for images, galleries, logos, and attachments.
            </p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'browse'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Browse Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Upload Media
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="max-w-2xl mx-auto py-8 w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
            Upload New Media Asset
          </h2>
          <MediaDropzone
            onUploaded={() => {
              setActiveTab('browse');
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Filters & Search */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search assets by filename or alt text..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={mimeFilter}
                onChange={(e) => {
                  setMimeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="">All Formats</option>
                <option value="image/">Images Only (JPG, PNG, WebP, SVG)</option>
                <option value="application/pdf">PDF Documents</option>
                <option value="video/">Videos (MP4)</option>
              </select>
            </div>
          </div>

          {/* Asset Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-xs">Loading media library...</span>
            </div>
          ) : mediaData?.items && mediaData.items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaData.items.map((asset) => (
                <MediaCard key={asset.id} asset={asset} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                No media assets found
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Drop your hero banners, screenshots, destination photos, or documents to get
                started.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                Upload First Asset
              </button>
            </div>
          )}

          {/* Pagination */}
          {mediaData && mediaData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500">
              <span>
                Page {mediaData.page} of {mediaData.totalPages} ({mediaData.total} total assets)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 border rounded-lg disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= mediaData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 border rounded-lg disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
