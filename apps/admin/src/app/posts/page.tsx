'use client';

import React, { useState } from 'react';
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
  useSubmitForReviewMutation,
} from '@/lib/cms-api';

export default function PostsPage() {
  const { t, locale, activeSiteId, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  // Filters
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

  const {
    data: postsData,
    isLoading,
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

  const posts = postsData?.items || [];
  const totalPages = postsData?.totalPages || 1;

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

  return (
    <ShellLayout>
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.content.title}
              </h1>
              {activeSite && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {activeSite.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.content.subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/posts/new"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.content.newPost}</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Search */}
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

          {/* Type Filter */}
          <div className="w-40">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.content.filterByType}</option>
              <option value="travel_guide">Travel Guide</option>
              <option value="air_sports_update">Air Sports Update</option>
              <option value="article">Article</option>
              <option value="news">Breaking News</option>
              <option value="event_update">Event Update</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.content.filterByStatus}</option>
              <option value="draft">{t.status.draft}</option>
              <option value="in_review">{t.status.in_review}</option>
              <option value="scheduled">{t.status.scheduled}</option>
              <option value="published">{t.status.published}</option>
              <option value="archived">{t.status.archived}</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.actions.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Content Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs font-semibold text-slate-400">Loading editorial content...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t.content.noPosts}
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Get started by creating a new article, destination guide, or live event update.
              </p>
              <Link
                href="/posts/new"
                className="mt-2 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.content.newPost}</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">{t.content.tableTitle}</th>
                    <th className="py-3 px-4">{t.content.type}</th>
                    <th className="py-3 px-4">{t.content.publicationStatus}</th>
                    <th className="py-3 px-4">{t.content.updated}</th>
                    <th className="py-3 px-4 text-right">{t.content.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {posts.map((post) => {
                    const pub = activeSiteId
                      ? post.publications?.find((p) => p.siteId === activeSiteId)
                      : post.publications?.[0];

                    const title = post.currentRevision?.title || 'Untitled Post';
                    const excerpt = post.currentRevision?.excerpt || 'No excerpt provided.';
                    const status = pub?.status || post.status;

                    return (
                      <tr
                        key={post.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Title & Slug */}
                        <td className="py-3.5 px-4 max-w-md">
                          <Link
                            href={`/posts/${post.id}/edit`}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {title}
                          </Link>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {excerpt}
                          </p>
                          {pub?.slug && (
                            <span className="text-[10px] font-mono text-slate-400">
                              /{pub.slug}
                            </span>
                          )}
                        </td>

                        {/* Content Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {post.type.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Publication Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {status === 'published' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{t.status.published}</span>
                            </span>
                          ) : status === 'scheduled' ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
                                <Clock className="w-3 h-3 text-purple-600" />
                                <span>{t.status.scheduled}</span>
                              </span>
                              {pub?.scheduledFor && (
                                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                                  {formatDateTime(pub.scheduledFor, locale, timezone)}
                                </span>
                              )}
                            </div>
                          ) : status === 'in_review' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>{t.status.in_review}</span>
                            </span>
                          ) : status === 'archived' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <Archive className="w-3 h-3 text-slate-500" />
                              <span>{t.status.archived}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{t.status.draft}</span>
                            </span>
                          )}
                        </td>

                        {/* Last Updated */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {formatDateTime(post.updatedAt, locale, timezone)}
                        </td>

                        {/* Action Dropdown Menu */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="relative inline-block text-left">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/posts/${post.id}/edit`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t.actions.edit}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  setOpenDropdownId(openDropdownId === post.id ? null : post.id)
                                }
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Open actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Dropdown Options */}
                            {openDropdownId === post.id && (
                              <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 text-left text-xs font-semibold">
                                {/* Edit */}
                                <Link
                                  href={`/posts/${post.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{t.actions.edit}</span>
                                </Link>

                                {pub && (
                                  <>
                                    {/* Submit for Review (if draft) */}
                                    {status === 'draft' && (
                                      <button
                                        type="button"
                                        onClick={() => handleSubmitForReview(pub)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{t.actions.submitReview}</span>
                                      </button>
                                    )}

                                    {/* Publish Immediately (if draft or in_review) */}
                                    {(status === 'draft' || status === 'in_review') && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('publish', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{t.actions.publishNow}</span>
                                      </button>
                                    )}

                                    {/* Schedule (if draft or in_review) */}
                                    {(status === 'draft' || status === 'in_review') && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('schedule', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{t.actions.schedule}</span>
                                      </button>
                                    )}

                                    {/* Reschedule (if scheduled) */}
                                    {status === 'scheduled' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('reschedule', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                                      >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{t.actions.reschedule}</span>
                                      </button>
                                    )}

                                    {/* Cancel Schedule (if scheduled) */}
                                    {status === 'scheduled' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenAction('cancelSchedule', pub, title)
                                        }
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>{t.actions.cancelSchedule}</span>
                                      </button>
                                    )}

                                    {/* Unpublish (if published) */}
                                    {status === 'published' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('unpublish', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>{t.actions.unpublish}</span>
                                      </button>
                                    )}

                                    {/* Archive */}
                                    {status !== 'archived' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('archive', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                      >
                                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{t.actions.archive}</span>
                                      </button>
                                    )}

                                    {/* Restore (if archived) */}
                                    {status === 'archived' && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAction('restore', pub, title)}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
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
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
                >
                  Next
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
