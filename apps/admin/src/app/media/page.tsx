'use client';

import React, { useState, useMemo } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useDeleteMediaMutation,
  useListMediaQuery,
  useUpdateMediaMutation,
} from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';
import {
  MediaMetricsCards,
  MediaHeader,
  MediaFilterBar,
  MediaCard,
  MediaListView,
  MediaDropzone,
  MediaDetailModal,
  formatBytes,
  type MediaViewMode,
  type MediaTab,
  type MediaStats,
} from '@/features/media';

export default function MediaPage() {
  const { t, activeSiteId, activeSite, availableSites, setActiveSiteId } = useAdmin();

  // Search, format filter & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [activeTab, setActiveTab] = useState<MediaTab>('browse');

  // Asset detail modal
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries and mutations
  const {
    data: mediaData,
    isLoading,
    isFetching,
    refetch,
  } = useListMediaQuery({
    siteId: activeSiteId || undefined,
    search: searchTerm.trim() || undefined,
    mimeType: mimeFilter || undefined,
    page,
    limit: 24,
  });

  const [deleteMedia] = useDeleteMediaMutation();
  const [updateMedia] = useUpdateMediaMutation();

  const items = useMemo(() => mediaData?.items ?? [], [mediaData]);

  // Derived statistics for top metric cards
  const stats = useMemo<MediaStats>(() => {
    const totalCount = mediaData?.total ?? items.length;
    let totalBytes = 0;
    let imageCount = 0;
    let docVideoCount = 0;

    for (const item of items) {
      const b = parseInt(item.byteSize, 10);
      if (Number.isFinite(b)) totalBytes += b;
      if (item.mimeType.startsWith('image/')) imageCount++;
      else docVideoCount++;
    }

    return {
      total: totalCount,
      storageFormatted: formatBytes(String(totalBytes)),
      images: imageCount,
      docsAndOther: docVideoCount,
    };
  }, [items, mediaData]);

  // Save metadata changes (Alt Text, Caption)
  const handleSaveMetadata = async (payload: { altText: string; caption: string }) => {
    if (!selectedAsset) return;
    setIsUpdating(true);
    try {
      const updated = await updateMedia({
        mediaId: selectedAsset.id,
        altText: payload.altText,
        caption: payload.caption,
      }).unwrap();
      setSelectedAsset(updated);
      refetch();
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete media asset
  const handleDelete = async (id: string) => {
    if (confirm(t.media.deleteConfirm || 'Are you sure you want to delete this media asset?')) {
      try {
        await deleteMedia(id).unwrap();
        if (selectedAsset?.id === id) {
          setSelectedAsset(null);
        }
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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        {/* 1. Header Row */}
        <MediaHeader
          title={t.media.title}
          subtitle={t.media.subtitle}
          activeSite={activeSite}
          allSitesLabel={t.nav.allSites || 'All Sites (Platform)'}
          isFetching={isFetching}
          onRefresh={() => refetch()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          browseLabel={t.media.browseLibrary || 'Browse Library'}
          uploadLabel={t.media.uploadTitle}
        />

        {/* 2. Top Metric Cards */}
        <MediaMetricsCards stats={stats} />

        {/* 3. Controls & Filter Bar */}
        <MediaFilterBar
          activeSiteId={activeSiteId}
          availableSites={availableSites}
          onSiteChange={(sId) => {
            setActiveSiteId(sId);
            setPage(1);
          }}
          mimeFilter={mimeFilter}
          onMimeFilterChange={(mime) => {
            setMimeFilter(mime);
            setPage(1);
          }}
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setPage(1);
          }}
        />

        {/* 4. Main Body: Upload Tab vs Browse Tab */}
        {activeTab === 'upload' ? (
          <div className="w-full max-w-3xl mx-auto py-6 bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
            <MediaDropzone
              siteId={activeSiteId || undefined}
              onUploaded={() => {
                setActiveTab('browse');
                refetch();
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Loading media assets...
                </span>
              </div>
            ) : items.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((asset) => (
                      <MediaCard
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAsset?.id === asset.id}
                        onSelect={setSelectedAsset}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <MediaListView
                    items={items}
                    onSelect={setSelectedAsset}
                    onCopyUrl={handleCopyUrl}
                    onDelete={handleDelete}
                  />
                )}

                {/* Pagination */}
                {mediaData && mediaData.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Page {mediaData.page} of {mediaData.totalPages} ({mediaData.total} items)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={page >= mediaData.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="p-1.5 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                  <ImageIcon className="size-8" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t.media.noMediaFound || 'No media assets found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {t.media.noMediaSub || 'Upload destination photography, banners, or editorial documents.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="mt-5 px-5 py-2.5 bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] rounded-xl text-xs font-bold hover:brightness-105 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                >
                  + {t.media.uploadFirst || 'Upload First Asset'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      <MediaDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onSaveMetadata={handleSaveMetadata}
        onDelete={handleDelete}
        isUpdating={isUpdating}
      />
    </ShellLayout>
  );
}
