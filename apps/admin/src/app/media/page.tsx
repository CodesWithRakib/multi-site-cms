'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Grid,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  Copy,
  Check,
  Trash2,
  X,
  Layers,
  HardDrive,
  RefreshCw,
  Globe,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { MediaCard, MediaDropzone } from '@/features/media';
import {
  useDeleteMediaMutation,
  useListMediaQuery,
  useUpdateMediaMutation,
} from '@/lib/cms-api';
import type { MediaAssetItem } from '@multi-site-cms/types';

function formatBytes(bytesStr: string): string {
  const bytes = parseInt(bytesStr, 10);
  if (!Number.isFinite(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function MediaPage() {
  const { t, activeSiteId, activeSite, availableSites, setActiveSiteId } = useAdmin();

  // Search, format filter & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Asset detail modal
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [editAltText, setEditAltText] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);

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
  const stats = useMemo(() => {
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

  // Open asset detail modal
  const handleOpenDetail = (asset: MediaAssetItem) => {
    setSelectedAsset(asset);
    setEditAltText(asset.altText || '');
    setEditCaption(asset.caption || '');
    setUpdateFeedback(null);
    setCopiedUrl(false);
  };

  // Close modal
  const handleCloseDetail = () => {
    setSelectedAsset(null);
    setUpdateFeedback(null);
  };

  // Copy public asset URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Save metadata changes (Alt Text, Caption)
  const handleSaveMetadata = async () => {
    if (!selectedAsset) return;
    setIsUpdating(true);
    setUpdateFeedback(null);
    try {
      const updated = await updateMedia({
        mediaId: selectedAsset.id,
        altText: editAltText.trim(),
        caption: editCaption.trim(),
      }).unwrap();
      setSelectedAsset(updated);
      setUpdateFeedback('Metadata saved successfully!');
      setTimeout(() => setUpdateFeedback(null), 3000);
      refetch();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setUpdateFeedback(
        'Failed: ' + (errorObj?.data?.error?.message || errorObj?.message || 'Could not update metadata'),
      );
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
          handleCloseDetail();
        }
        refetch();
      } catch (err: unknown) {
        const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
        alert(
          'Failed to delete asset: ' +
            (errorObj?.data?.error?.message || errorObj?.message || t.media.inUseWarning || 'Media is currently in use.'),
        );
      }
    }
  };

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        {/* ========================================================= */}
        {/* TOP HEADER: Title, Live Tenant Badge, Refresh & Tab Switch */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.media.title}
              </h1>
              {activeSite ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00e599]/10 text-[#00e599] border border-[#00e599]/20 shadow-xs">
                  <span className="size-2 rounded-full bg-[#00e599] animate-pulse" />
                  {activeSite.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Globe className="size-3" />
                  {t.nav.allSites || 'All Sites (Platform)'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              {t.media.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh media library"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* View Mode Toggle (Grid / List) */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title={t.media.gridView || 'Grid View'}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Grid className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title={t.media.listView || 'List View'}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <List className="size-4" />
              </button>
            </div>

            {/* Browse / Upload Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers className="size-3.5" />
                <span>{t.media.browseLibrary || 'Browse Library'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Upload className="size-3.5" />
                <span>{t.media.uploadTitle}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOP METRICS: 4 Squircle Stat Cards */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Assets */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                <ImageIcon className="size-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ↑ 12.5%
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.media.totalAssets || 'Total Assets'}
              </div>
            </div>
            {/* Sparkline decoration */}
            <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
              <path d="M0 35 Q 25 10, 50 25 T 100 5" fill="none" stroke="#3b82f6" strokeWidth="3" />
            </svg>
          </div>

          {/* Card 2: Storage Used */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                <HardDrive className="size-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Local Storage
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.storageFormatted}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.media.storageUsed || 'Storage Used'}
              </div>
            </div>
            <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
              <path d="M0 30 Q 30 5, 60 20 T 100 8" fill="none" stroke="#00e599" strokeWidth="3" />
            </svg>
          </div>

          {/* Card 3: Images & Photos */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <ImageIcon className="size-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                WebP/SVG/JPG
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.images}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.media.imagesCount || 'Images & Photos'}
              </div>
            </div>
            <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
              <path d="M0 38 Q 35 15, 70 25 T 100 12" fill="none" stroke="#f59e0b" strokeWidth="3" />
            </svg>
          </div>

          {/* Card 4: Documents & Other */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="size-11 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center">
                <FileText className="size-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                PDF & Video
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.docsAndOther}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {t.media.documentsCount || 'Documents & Files'}
              </div>
            </div>
            <svg className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none" viewBox="0 0 100 40">
              <path d="M0 25 Q 20 35, 60 10 T 100 15" fill="none" stroke="#a855f7" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CONTROLS BAR: Multi-tenant Pills, Format Pills & Search */}
        {/* ========================================================= */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Multi-Tenant Switcher Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mr-1">
                {t.media.activeScope || 'Active Scope'}:
              </span>

              {/* All Sites Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveSiteId(null);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !activeSiteId
                    ? 'bg-[#082625] dark:bg-slate-800 text-[#00e599] shadow-xs ring-1 ring-[#00e599]/30'
                    : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.nav.allSites || 'All Sites'}
              </button>

              {availableSites.map((site) => {
                const isActive = activeSiteId === site.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setActiveSiteId(site.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#082625] dark:bg-slate-800 text-[#00e599] shadow-xs ring-1 ring-[#00e599]/30'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {site.name}
                  </button>
                );
              })}
            </div>

            {/* Format Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {[
                { label: t.media.allFormats || 'All Formats', value: '' },
                { label: t.media.imagesOnly || 'Images', value: 'image/' },
                { label: t.media.documentsOnly || 'Documents', value: 'application/pdf' },
                { label: t.media.videosOnly || 'Videos', value: 'video/' },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => {
                    setMimeFilter(fmt.value);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mimeFilter === fmt.value
                      ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={t.actions.search || 'Search media by filename, alt text, or caption...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#00e599] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: Upload Tab vs Browse Tab */}
        {/* ========================================================= */}
        {activeTab === 'upload' ? (
          <div className="w-full max-w-3xl mx-auto py-6 bg-white dark:bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {t.media.uploadTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.media.supportedFormats}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

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
            {/* Loading state */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Loading media assets...
                </span>
              </div>
            ) : items.length > 0 ? (
              <>
                {/* GRID VIEW */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((asset) => (
                      <MediaCard
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAsset?.id === asset.id}
                        onSelect={handleOpenDetail}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
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

                          return (
                            <tr
                              key={asset.id}
                              onClick={() => handleOpenDetail(asset)}
                              className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <td className="py-2.5 px-4">
                                <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                                  {isImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={assetUrl}
                                      alt={asset.altText || asset.originalFilename || 'Media'}
                                      className="size-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : isVideo ? (
                                    <Video className="size-5 text-slate-400" />
                                  ) : isPdf ? (
                                    <FileText className="size-5 text-red-400" />
                                  ) : (
                                    <ImageIcon className="size-5 text-slate-400" />
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs">
                                <div className="truncate" title={asset.originalFilename || asset.storageKey}>
                                  {asset.originalFilename || asset.storageKey.split('/').pop()}
                                </div>
                                {asset.altText && (
                                  <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate font-normal">
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
                                    onClick={() => handleCopyUrl(assetUrl)}
                                    title={t.media.copyUrl || 'Copy URL'}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Copy className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(asset.id)}
                                    title="Delete Media"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
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
                )}

                {/* PAGINATION */}
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
              /* EMPTY STATE */
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

        {/* ========================================================= */}
        {/* ASSET DETAIL / PREVIEW MODAL */}
        {/* ========================================================= */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-md">
                    {selectedAsset.originalFilename || selectedAsset.storageKey.split('/').pop()}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedAsset.mimeType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Modal Body: Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                {/* Left: Preview */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="relative aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex items-center justify-center">
                    {selectedAsset.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedAsset.url || `/api/v1/media/assets/${selectedAsset.storageKey}`}
                        alt={selectedAsset.altText || 'Media preview'}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : selectedAsset.mimeType === 'application/pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <FileText className="size-16 text-red-500" />
                        <span className="text-xs font-semibold">PDF Document</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Video className="size-16 text-blue-500" />
                        <span className="text-xs font-semibold">Video Stream</span>
                      </div>
                    )}
                  </div>

                  {/* Copy URL & Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(selectedAsset.url || `/api/v1/media/assets/${selectedAsset.storageKey}`)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        copiedUrl
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {copiedUrl ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      <span>{copiedUrl ? (t.media.copied || 'Copied!') : (t.media.copyUrl || 'Copy Asset URL')}</span>
                    </button>

                    <a
                      href={selectedAsset.url || `/api/v1/media/assets/${selectedAsset.storageKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="size-4" />
                    </a>

                    <a
                      href={selectedAsset.url || `/api/v1/media/assets/${selectedAsset.storageKey}`}
                      download={selectedAsset.originalFilename || 'asset'}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title={t.media.download || 'Download Asset'}
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                </div>

                {/* Right: Metadata Details & Inline Editor */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    {/* File properties table */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Dimensions:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {selectedAsset.width && selectedAsset.height
                            ? `${selectedAsset.width} × ${selectedAsset.height}`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">File Size:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {formatBytes(selectedAsset.byteSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">MIME:</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {selectedAsset.mimeType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Uploaded:</span>
                        <span className="text-slate-900 dark:text-white">
                          {new Date(selectedAsset.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Storage Key:</span>
                        <span className="font-mono text-[10px] text-slate-500 break-all">
                          {selectedAsset.storageKey}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Edit Form */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t.media.altText || 'Alt Text (Screen Readers)'}
                        </label>
                        <input
                          type="text"
                          value={editAltText}
                          onChange={(e) => setEditAltText(e.target.value)}
                          placeholder="Descriptive image summary"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00e599]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t.media.caption || 'Editorial Caption'}
                        </label>
                        <textarea
                          rows={2}
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Photo credits, context, or editorial caption"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#00e599] resize-none"
                        />
                      </div>

                      {updateFeedback && (
                        <div
                          className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium ${
                            updateFeedback.startsWith('Failed')
                              ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30'
                          }`}
                        >
                          {updateFeedback.startsWith('Failed') ? (
                            <AlertCircle className="size-3.5 shrink-0" />
                          ) : (
                            <CheckCircle2 className="size-3.5 shrink-0" />
                          )}
                          <span>{updateFeedback}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedAsset.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleSaveMetadata}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] hover:brightness-105 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
                      <span>{t.media.saveChanges || 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
