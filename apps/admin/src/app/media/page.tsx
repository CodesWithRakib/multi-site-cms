'use client';

import { Pagination } from '@/components/navigation/Pagination';
import { useClampPage, useUrlPagination } from '@/lib/pagination/useUrlPagination';
import React, { useState, useMemo } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { ActionNotice, ConfirmDialog, useActionNotice } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { apiErrorMessage } from '@/lib/api-error';
import { useAdmin } from '@/lib/admin-context';
import { useDeleteMediaMutation, useListMediaQuery, useUpdateMediaMutation } from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';
import {
  MediaMetricsCards,
  MediaHeader,
  MediaFilterBar,
  MediaCard,
  MediaListView,
  MediaDropzone,
  MediaDetailModal,
  MediaBatchActionBar,
  formatBytes,
  type MediaViewMode,
  type MediaTab,
  type MediaStats,
} from '@/features/media';

/** Media is a card grid, so sizes are multiples of the grid columns. */
const MEDIA_PAGE_SIZE = 24;
const MEDIA_PAGE_SIZES: readonly number[] = [12, 24, 48, 96];

export default function MediaPage() {
  const { t, activeSiteId, activeSite, availableSites, setActiveSiteId } = useAdmin();

  // Search, format filter & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const urlPagination = useUrlPagination({
    defaultLimit: MEDIA_PAGE_SIZE,
    limits: MEDIA_PAGE_SIZES,
  });
  const { page, limit, limits, setPage, setLimit, resetPage } = urlPagination;
  const [viewMode, setViewMode] = useState<MediaViewMode>('grid');
  const [activeTab, setActiveTab] = useState<MediaTab>('browse');

  // Asset detail modal & batch selection
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const notices = useActionNotice();

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
    limit,
  });
  useClampPage(urlPagination, mediaData?.totalPages ?? 1, Boolean(mediaData));

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

  // Deletion asks once, here (cards and the detail modal only report intent).
  const handleDelete = (id: string) => setPendingDelete({ ids: [id] });

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { ids } = pendingDelete;
    setIsDeleting(true);
    // allSettled: one failed deletion must not hide the others' results.
    const results = await Promise.allSettled(ids.map((id) => deleteMedia(id).unwrap()));
    const deleted = ids.filter((_, index) => results[index]?.status === 'fulfilled');
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');

    if (selectedAsset && deleted.includes(selectedAsset.id)) setSelectedAsset(null);
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      deleted.forEach((id) => next.delete(id));
      return next;
    });
    if (!failed) {
      notices.success(
        deleted.length === 1 ? 'Media deleted.' : `Deleted ${deleted.length} media items.`,
      );
    } else {
      const reason = apiErrorMessage(failed.reason, 'please try again');
      notices.error(
        ids.length === 1
          ? `Could not delete: ${reason}`
          : `Deleted ${deleted.length} of ${ids.length}. Some could not be deleted: ${reason}`,
      );
    }
    setIsDeleting(false);
    setPendingDelete(null);
    refetch();
  };

  // Batch selection handlers
  const handleToggleBatchSelect = (id: string, selected: boolean) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAllOnPage = (selected: boolean) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      items.forEach((item) => (selected ? next.add(item.id) : next.delete(item.id)));
      return next;
    });
  };

  const handleBatchDelete = () => {
    if (selectedBatchIds.size === 0) return;
    setPendingDelete({ ids: Array.from(selectedBatchIds) });
  };

  const allSelectedOnPage = items.length > 0 && items.every((i) => selectedBatchIds.has(i.id));

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-20">
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

        <ActionNotice notice={notices.notice} onDismiss={notices.dismiss} />

        <MediaMetricsCards stats={stats} />

        <MediaFilterBar
          activeSiteId={activeSiteId}
          availableSites={availableSites}
          onSiteChange={(sId) => {
            setActiveSiteId(sId);
            resetPage();
          }}
          mimeFilter={mimeFilter}
          onMimeFilterChange={(mime) => {
            setMimeFilter(mime);
            resetPage();
          }}
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            resetPage();
          }}
        />

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
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
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
                        isBatchSelected={selectedBatchIds.has(asset.id)}
                        onSelect={setSelectedAsset}
                        onToggleBatchSelect={handleToggleBatchSelect}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <MediaListView
                    items={items}
                    selectedBatchIds={selectedBatchIds}
                    onToggleBatchSelect={handleToggleBatchSelect}
                    onSelectAll={handleSelectAllOnPage}
                    onSelect={setSelectedAsset}
                    onCopyUrl={(url) => navigator.clipboard.writeText(url)}
                    onDelete={handleDelete}
                  />
                )}

                {mediaData && (
                  <Pagination
                    page={mediaData.page}
                    totalPages={mediaData.totalPages}
                    total={mediaData.total}
                    pageSize={limit}
                    pageSizeOptions={limits}
                    itemLabel="items"
                    onPageChange={setPage}
                    onPageSizeChange={setLimit}
                  />
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <ImageIcon className="size-8" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {t.media.noMediaFound || 'No media assets found'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {t.media.noMediaSub ||
                    'Upload destination photography, banners, or editorial documents.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="mt-5 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:brightness-105 shadow-md shadow-emerald-500/20 cursor-pointer transition"
                >
                  + {t.media.uploadFirst || 'Upload First Asset'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <MediaDetailModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        onSaveMetadata={handleSaveMetadata}
        onDelete={handleDelete}
        isUpdating={isUpdating}
      />

      <MediaBatchActionBar
        selectedCount={selectedBatchIds.size}
        totalOnPage={items.length}
        allSelectedOnPage={allSelectedOnPage}
        onSelectAllOnPage={handleSelectAllOnPage}
        onClearSelection={() => setSelectedBatchIds(new Set())}
        onDeleteSelected={handleBatchDelete}
        isDeleting={isDeleting}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete && pendingDelete.ids.length > 1
            ? `Delete ${pendingDelete.ids.length} media items?`
            : 'Delete this media item?'
        }
        description="The files are deleted from storage and removed from every post that uses them (featured images and images inside articles). This cannot be undone."
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </ShellLayout>
  );
}
