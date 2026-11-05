'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Loader2,
  FileText,
  MoreVertical,
  Calendar,
  Send,
  RotateCcw,
  Archive,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ExternalLink,
  Globe,
  RefreshCw,
  ArrowUp,
} from 'lucide-react';
import type { PostPublicationItem } from '@multi-site-cms/types';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';
import {
  PublishingModal,
  type PublishingActionType,
} from '@/features/posts/components/PublishingModal';
import {
  useDeletePostMutation,
  useListPostsQuery,
  useListSitesQuery,
  useSubmitForReviewMutation,
} from '@/lib/cms-api';

export default function PostsPage() {
  const { t, locale, activeSiteId, activeSite, setActiveSiteId } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<PublishingActionType>('publish');
  const [targetPublication, setTargetPublication] = useState<PostPublicationItem | null>(null);
  const [targetPostTitle, setTargetPostTitle] = useState<string>('');

  // Dropdown open state per row
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const { data: sites = [] } = useListSitesQuery();

  const {
    data: postsData,
    isLoading,
    isFetching,
    refetch,
  } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: searchTerm.trim() || undefined,
    page,
    limit: 10,
  });

  const [deletePost] = useDeletePostMutation();
  const [submitForReview] = useSubmitForReviewMutation();

  // Overview items for computing accurate top metrics & tab counters independently of active filters
  const { data: statsOverviewData } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    page: 1,
    limit: 100,
  });

  const posts = useMemo(() => postsData?.items ?? [], [postsData?.items]);
  const totalPosts = postsData?.total || posts.length;
  const totalPages = postsData?.totalPages || 1;

  // Filter posts client-side if needed to strictly match the effective publication status
  const displayPosts = useMemo(() => {
    if (!statusFilter) return posts;
    return posts.filter((post) => {
      const pub = activeSiteId
        ? post.publications?.find((p) => p.siteId === activeSiteId)
        : post.publications?.[0];
      const effStatus = pub?.status || post.status;
      return effStatus === statusFilter;
    });
  }, [posts, statusFilter, activeSiteId]);

  // Compute live metrics for the top metric cards
  const stats = useMemo(() => {
    const items = statsOverviewData?.items || posts;
    let publishedCount = 0;
    let draftsCount = 0;
    let scheduledCount = 0;
    let inReviewCount = 0;
    let archivedCount = 0;

    for (const post of items) {
      const pub = post.publications?.[0];
      const effStatus = pub?.status || post.status;
      if (effStatus === 'published') publishedCount++;
      else if (effStatus === 'draft') draftsCount++;
      else if (effStatus === 'scheduled') scheduledCount++;
      else if (effStatus === 'in_review') inReviewCount++;
      else if (effStatus === 'archived') archivedCount++;
    }

    return {
      total: statsOverviewData?.total || items.length,
      published: publishedCount,
      drafts: draftsCount,
      scheduled: scheduledCount,
      inReview: inReviewCount,
      archived: archivedCount,
    };
  }, [statsOverviewData?.items, statsOverviewData?.total, posts]);

  const handleOpenAction = (
    action: PublishingActionType,
    pub: PostPublicationItem,
    title: string,
  ) => {
    setModalAction(action);
    setTargetPublication(pub);
    setTargetPostTitle(title);
    setModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleSubmitForReview = async (pub: PostPublicationItem) => {
    try {
      await submitForReview({ siteId: pub.siteId, publicationId: pub.id }).unwrap();
      refetch();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert('Review submission failed: ' + (errorObj?.message || 'Server error'));
    }
  };

  const handleDeletePost = async (postId: string, title: string) => {
    if (confirm(`Are you sure you want to delete post "${title}"?`)) {
      try {
        await deletePost(postId).unwrap();
        refetch();
      } catch (err: unknown) {
        const errorObj = err as { message?: string };
        alert('Failed to delete post: ' + (errorObj?.message || 'Server error'));
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || typeFilter || statusFilter);

  // Status Filter Tabs
  const statusTabs = [
    { id: '', label: t.content.allPosts || 'All Posts', count: stats.total },
    { id: 'published', label: t.status.published, count: stats.published },
    { id: 'draft', label: t.status.draft, count: stats.drafts },
    { id: 'scheduled', label: t.status.scheduled, count: stats.scheduled },
    { id: 'in_review', label: t.status.in_review, count: stats.inReview },
    { id: 'archived', label: t.status.archived, count: stats.archived },
  ];

  return (
    <ShellLayout>
      <div className="w-full flex flex-col gap-6">
        {/* 1. Header Bar: Title, Site Pill, Refresh, + Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 pb-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                {t.content.title}
              </h1>
              {activeSite ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeSite.name}</span>
                  <button
                    type="button"
                    onClick={() => setActiveSiteId(null)}
                    className="p-0.5 hover:text-rose-500 transition-colors"
                    title="Clear site filter"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  {t.dashboard.allSites || 'All Sites'}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.content.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
              title="Refresh Posts"
              aria-label="Refresh Posts"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? 'animate-spin text-emerald-500' : ''}`}
              />
            </button>

            {/* Gradient Mint Create CTA Button */}
            <Link
              href="/posts/new"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 hover:from-brand-500 hover:to-brand-400 text-brand-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.5]" />
              <span>{t.content.newPost}</span>
            </Link>
          </div>
        </div>

        {/* 2. Top Metric Cards Row (4 Stat Cards matching Dashboard Style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Posts */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-blue-500 to-blue-600">
                <FileText className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.content.totalPosts || 'Total Posts'}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    {stats.total}
                  </span>
                  <div className="flex items-center text-emerald-500 text-xs font-semibold gap-0.5">
                    <ArrowUp className="size-3 stroke-[2.5]" />
                    <span>+{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-20 h-10 shrink-0">
              <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
                <path
                  d="M 2 28 C 15 28, 20 12, 32 18 C 42 24, 52 8, 62 14 C 70 19, 75 10, 78 6"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Published */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-emerald-400 to-teal-500">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.status.published}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    {stats.published}
                  </span>
                  <span className="text-xs font-semibold text-emerald-500">Active</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-20 h-10 shrink-0">
              <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
                <path
                  d="M 2 25 C 15 20, 30 30, 45 15 C 60 8, 70 12, 78 5"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Drafts */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-amber-400 to-orange-500">
                <Clock className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.status.draft}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    {stats.drafts}
                  </span>
                  <span className="text-xs font-semibold text-amber-500">In Progress</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-20 h-10 shrink-0">
              <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
                <path
                  d="M 2 20 C 20 28, 40 18, 60 22 C 70 25, 75 14, 78 10"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: Scheduled */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex items-center justify-between transition-all hover:shadow-sm">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-purple-500 to-indigo-600">
                <Calendar className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {t.status.scheduled}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                    {stats.scheduled}
                  </span>
                  <span className="text-xs font-semibold text-purple-500">Queued</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-20 h-10 shrink-0">
              <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
                <path
                  d="M 2 30 C 20 15, 40 25, 60 12 C 70 10, 75 8, 78 4"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Horizontal Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id || 'all'}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-brand-400 text-brand-950 font-bold shadow-md shadow-brand-400/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-brand-950/15 text-brand-950'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Filter Bar (Search, Type Filter, Site Filter, Clear) */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xs">
          {/* Pill Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={t.actions.search || 'Search posts...'}
              className="w-full h-10 pl-10 pr-9 text-xs rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Content Type Filter */}
          <div className="w-48">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-pointer"
            >
              <option value="">{t.content.filterByType || 'All Types'}</option>
              <option value="travel_guide">Travel Guide</option>
              <option value="air_sports_update">Air Sports Update</option>
              <option value="article">Article</option>
              <option value="news">Breaking News</option>
              <option value="event_update">Event Update</option>
            </select>
          </div>

          {/* Site Target Filter */}
          <div className="w-48">
            <select
              value={activeSiteId || ''}
              onChange={(e) => {
                setActiveSiteId(e.target.value || null);
                setPage(1);
              }}
              className="w-full h-10 px-3 text-xs font-medium rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all cursor-pointer"
            >
              <option value="">{t.content.filterBySite || 'All Websites'}</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 h-10 px-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
              <span>{t.actions.clearFilters || 'Clear Filters'}</span>
            </button>
          )}
        </div>

        {/* 5. Modern Content Table */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <Loader2 className="size-7 animate-spin text-emerald-500" />
              <p className="text-xs font-semibold text-slate-400">Loading editorial content...</p>
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
              <FileText className="size-12 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t.content.noPosts || 'No content found matching your filters.'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Get started by creating a new article, destination guide, or live event update.
              </p>
              <Link
                href="/posts/new"
                className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 text-brand-950 font-bold px-4 py-2 text-xs shadow-xs"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>{t.content.newPost}</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">{t.content.tableTitle || 'Post & Summary'}</th>
                    <th className="py-3.5 px-4">{t.content.type || 'Content Type'}</th>
                    <th className="py-3.5 px-4">
                      {t.content.publicationStatus || 'Site Publication'}
                    </th>
                    <th className="py-3.5 px-4">{t.content.updated || 'Last Updated'}</th>
                    <th className="py-3.5 px-6 text-right">{t.content.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {displayPosts.map((post) => {
                    const pub = activeSiteId
                      ? post.publications?.find((p) => p.siteId === activeSiteId)
                      : post.publications?.[0];

                    const title = post.currentRevision?.title || 'Untitled Post';
                    const excerpt = post.currentRevision?.excerpt || 'No excerpt provided.';
                    const status = pub?.status || post.status;
                    const isAir = post.type.toLowerCase().includes('air');
                    const isTravel =
                      post.type.toLowerCase().includes('travel') ||
                      post.type.toLowerCase().includes('guide');

                    // Find corresponding target site
                    const targetSite = sites.find((s) => s.id === pub?.siteId);
                    const primaryDomain =
                      targetSite?.domains?.find((d) => d.isPrimary)?.hostname ||
                      targetSite?.domains?.[0]?.hostname ||
                      `${targetSite?.key || 'site'}.yourdomain.com`;
                    const liveUrl = pub?.slug ? `https://${primaryDomain}/${pub.slug}` : null;

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        {/* Title & Thumbnail */}
                        <td className="py-4 px-6 max-w-md">
                          <div className="flex items-center gap-3.5">
                            {/* Rich Scenic Vector Thumbnail */}
                            <div className="size-12 rounded-xl overflow-hidden shrink-0 shadow-2xs border border-slate-200/60 dark:border-slate-700/60">
                              {isAir ? (
                                <svg
                                  viewBox="0 0 80 55"
                                  className="size-full object-cover"
                                  fill="none"
                                >
                                  <defs>
                                    <linearGradient
                                      id={`postSky-${post.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop offset="0%" stopColor="#0284c7" />
                                      <stop offset="100%" stopColor="#7dd3fc" />
                                    </linearGradient>
                                  </defs>
                                  <rect width="80" height="55" fill={`url(#postSky-${post.id})`} />
                                  <ellipse
                                    cx="20"
                                    cy="40"
                                    rx="18"
                                    ry="8"
                                    fill="#ffffff"
                                    fillOpacity="0.8"
                                  />
                                  <ellipse
                                    cx="60"
                                    cy="35"
                                    rx="20"
                                    ry="9"
                                    fill="#ffffff"
                                    fillOpacity="0.75"
                                  />
                                  <g transform="translate(40, 22) rotate(-15)">
                                    <path d="M -15 -1 L 15 -1 L 12 1 L -12 1 Z" fill="#dc2626" />
                                    <rect
                                      x="-2"
                                      y="-7"
                                      width="4"
                                      height="14"
                                      rx="1"
                                      fill="#b91c1c"
                                    />
                                    <path d="M -6 6 L 6 6 L 0 3 Z" fill="#991b1b" />
                                  </g>
                                </svg>
                              ) : isTravel ? (
                                <svg
                                  viewBox="0 0 80 55"
                                  className="size-full object-cover"
                                  fill="none"
                                >
                                  <defs>
                                    <linearGradient
                                      id={`postMtn-${post.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop offset="0%" stopColor="#0284c7" />
                                      <stop offset="60%" stopColor="#38bdf8" />
                                      <stop offset="100%" stopColor="#bae6fd" />
                                    </linearGradient>
                                  </defs>
                                  <rect width="80" height="55" fill={`url(#postMtn-${post.id})`} />
                                  <polygon points="10,40 32,15 54,40" fill="#0f766e" />
                                  <polygon points="32,15 28,21 32,23 37,21" fill="#ffffff" />
                                  <polygon points="35,40 52,18 70,40" fill="#047857" />
                                  <polygon points="52,18 48,24 53,26 57,23" fill="#ffffff" />
                                  <rect y="38" width="80" height="17" fill="#0891b2" />
                                </svg>
                              ) : (
                                <div className="size-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                  <FileText className="size-5" />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/posts/${post.id}/edit`}
                                className="font-bold text-slate-900 dark:text-white hover:text-emerald-500 transition-colors line-clamp-1"
                              >
                                {title}
                              </Link>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {excerpt}
                              </p>
                              {pub?.slug && (
                                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                                  /{pub.slug}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Content Type Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                              isTravel
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                                : isAir
                                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80'
                            }`}
                          >
                            {post.type.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Publication Status & Site Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {status === 'published' ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{t.status.published}</span>
                              </span>
                              {targetSite && (
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  <Globe className="size-3 text-slate-400" />
                                  <span>{targetSite.name}</span>
                                  {liveUrl && (
                                    <a
                                      href={liveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 ml-1 font-semibold"
                                    >
                                      <span>{t.content.liveSite || 'Live'}</span>
                                      <ExternalLink className="size-2.5" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : status === 'scheduled' ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                                <Clock className="size-3 text-purple-500" />
                                <span>{t.status.scheduled}</span>
                              </span>
                              {pub?.scheduledFor && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                  {formatDateTime(pub.scheduledFor, locale, timezone)}
                                </span>
                              )}
                            </div>
                          ) : status === 'in_review' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                              <AlertCircle className="size-3 text-amber-500" />
                              <span>{t.status.in_review}</span>
                            </span>
                          ) : status === 'archived' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Archive className="size-3 text-slate-400" />
                              <span>{t.status.archived}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Clock className="size-3 text-slate-400" />
                              <span>{t.status.draft}</span>
                            </span>
                          )}
                        </td>

                        {/* Author & Last Updated */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              RI
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                                Rakib Islam
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatDateTime(post.updatedAt, locale, timezone)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Action Menu */}
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="relative inline-block text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Edit */}
                              <Link
                                href={`/posts/${post.id}/edit`}
                                className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
                                title={t.actions.edit}
                              >
                                <Edit3 className="size-4" />
                              </Link>

                              {/* Quick Publish CTA button if draft */}
                              {pub && (status === 'draft' || status === 'in_review') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAction('publish', pub, title)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title={t.actions.publishNow}
                                >
                                  <Send className="size-3" />
                                  <span>{t.actions.publishNow || 'Publish'}</span>
                                </button>
                              )}

                              {/* More Options Dropdown */}
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenDropdownId(openDropdownId === post.id ? null : post.id)
                                }
                                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                aria-label="Open actions"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </div>

                            {/* Dropdown Options */}
                            {openDropdownId === post.id && (
                              <div className="absolute right-0 mt-1 w-52 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 text-left text-xs font-semibold">
                                {/* Edit */}
                                <Link
                                  href={`/posts/${post.id}/edit`}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit3 className="size-3.5 text-slate-400" />
                                  <span>{t.actions.edit}</span>
                                </Link>

                                {pub && (
                                  <>
                                    {/* Submit for Review */}
                                    {status === 'draft' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSubmitForReview(pub)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      >
                                        <AlertCircle className="size-3.5 text-amber-500" />
                                        <span>{t.actions.submitReview}</span>
                                      </button>
                                    )}

                                    {/* Schedule */}
                                    {(status === 'draft' || status === 'in_review') && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('schedule', pub, title)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
                                      >
                                        <Clock className="size-3.5" />
                                        <span>{t.actions.schedule}</span>
                                      </button>
                                    )}

                                    {/* Reschedule */}
                                    {status === 'scheduled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('reschedule', pub, title)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
                                      >
                                        <Calendar className="size-3.5" />
                                        <span>{t.actions.reschedule}</span>
                                      </button>
                                    )}

                                    {/* Cancel Schedule */}
                                    {status === 'scheduled' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenAction('cancelSchedule', pub, title)
                                        }
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="size-3.5" />
                                        <span>{t.actions.cancelSchedule}</span>
                                      </button>
                                    )}

                                    {/* Unpublish */}
                                    {status === 'published' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('unpublish', pub, title)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                      >
                                        <RotateCcw className="size-3.5" />
                                        <span>{t.actions.unpublish}</span>
                                      </button>
                                    )}

                                    {/* Archive */}
                                    {status !== 'archived' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('archive', pub, title)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      >
                                        <Archive className="size-3.5 text-slate-400" />
                                        <span>{t.actions.archive}</span>
                                      </button>
                                    )}

                                    {/* Restore */}
                                    {status === 'archived' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('restore', pub, title)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                                      >
                                        <CheckCircle2 className="size-3.5" />
                                        <span>{t.actions.restore}</span>
                                      </button>
                                    )}
                                  </>
                                )}

                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                {/* Delete Post */}
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id, title)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span>{t.actions.delete}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Modern Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500">
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {t.content.showing || 'Showing'} {(page - 1) * 10 + 1} -{' '}
                {Math.min(page * 10, totalPosts)} {t.content.of || 'of'} {totalPosts}{' '}
                {t.content.posts || 'posts'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  {t.content.previous || 'Previous'}
                </button>
                <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80">
                  {page}
                </div>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  {t.content.next || 'Next'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shared Publishing Modal */}
      {targetPublication && (
        <PublishingModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setTargetPublication(null);
          }}
          action={modalAction}
          publication={targetPublication}
          postTitle={targetPostTitle}
          onSuccess={() => refetch()}
        />
      )}
    </ShellLayout>
  );
}
