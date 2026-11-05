'use client';

import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { CommentStatus } from '@multi-site-cms/types';
import {
  useBatchUpdateCommentsMutation,
  useDeleteCommentMutation,
  useListCommentsQuery,
  useUpdateCommentStatusMutation,
} from '@/lib/cms-api';
import { CommentModerationCard } from './CommentModerationCard';
import { CommentsBatchActions } from './CommentsBatchActions';
import { CommentsFilterBar } from './CommentsFilterBar';
import { CommentsPagination } from './CommentsPagination';
import { CommentsStatusTabs } from './CommentsStatusTabs';
import { ConfirmDialog } from '@/components/feedback';

export function CommentsModerationContainer() {
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data, isLoading, isFetching, refetch } = useListCommentsQuery({
    status: activeStatus !== 'all' ? activeStatus : undefined,
    siteId: selectedSiteId || undefined,
    search: search.trim() || undefined,
    page,
    limit,
  });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateCommentStatusMutation();
  const [batchUpdate, { isLoading: isBatchUpdating }] = useBatchUpdateCommentsMutation();
  const [deleteComment, { isLoading: isDeleting }] = useDeleteCommentMutation();

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (items: { id: string }[]) => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleUpdateSingleStatus = async (id: string, status: CommentStatus) => {
    try {
      await updateStatus({ id, status }).unwrap();
      showToast('success', `Comment marked as ${status}.`);
    } catch {
      showToast('error', 'Failed to update comment status.');
    }
  };

  const handleBatchStatus = async (status: CommentStatus) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await batchUpdate({ ids: selectedIds, status }).unwrap();
      showToast('success', `Updated ${res.updatedCount} comments to ${status}.`);
      setSelectedIds([]);
    } catch {
      showToast('error', 'Failed to perform batch update.');
    }
  };

  // Deletion is permanent, so it is confirmed in a dialog (was native confirm()).
  const handleDeleteSingle = (id: string) => setPendingDeleteIds([id]);
  const handleBatchDelete = () => {
    if (selectedIds.length > 0) setPendingDeleteIds([...selectedIds]);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteIds) return;
    const ids = pendingDeleteIds;
    const results = await Promise.allSettled(ids.map((id) => deleteComment(id).unwrap()));
    const deleted = ids.filter((_, index) => results[index]?.status === 'fulfilled');
    setSelectedIds((prev) => prev.filter((item) => !deleted.includes(item)));
    if (deleted.length === ids.length) {
      showToast(
        'success',
        ids.length === 1
          ? 'Comment permanently deleted.'
          : `Permanently deleted ${ids.length} comments.`,
      );
    } else {
      showToast('error', `Deleted ${deleted.length} of ${ids.length} comments; the rest failed.`);
    }
    setPendingDeleteIds(null);
  };

  const comments = data?.items ?? [];
  const counts = data?.counts ?? { all: 0, pending: 0, approved: 0, rejected: 0, spam: 0 };
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Comments Moderation
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Review, approve, spam-check, and manage reader discussions across all publications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs sm:text-sm font-medium shadow-xs animate-in fade-in duration-150 ${
            toastMessage.type === 'success'
              ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
              : 'border border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Status Tabs */}
      <CommentsStatusTabs
        activeStatus={activeStatus}
        counts={counts}
        onStatusChange={(st) => {
          setActiveStatus(st);
          setPage(1);
          setSelectedIds([]);
        }}
      />

      {/* Filter and Search Bar */}
      <CommentsFilterBar
        search={search}
        selectedSiteId={selectedSiteId}
        isFetching={isFetching}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onSiteChange={(site) => {
          setSelectedSiteId(site);
          setPage(1);
        }}
        onRefresh={() => refetch()}
      />

      {/* Batch Actions Bar */}
      <CommentsBatchActions
        selectedCount={selectedIds.length}
        isUpdating={isBatchUpdating || isUpdatingStatus || isDeleting}
        onBatchStatus={handleBatchStatus}
        onBatchDelete={handleBatchDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm">Loading dispatches and discussions...</p>
        </div>
      ) : comments.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground text-base">No comments found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {search
              ? 'No reflections matched your search query. Try clearing filters.'
              : `There are currently no comments under "${activeStatus}".`}
          </p>
        </div>
      ) : (
        /* Comments List */
        <div className="space-y-3">
          {/* Select all bar */}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={comments.length > 0 && selectedIds.length === comments.length}
                onChange={() => handleSelectAll(comments)}
                className="h-4 w-4 rounded border-border text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Select all on page ({comments.length})</span>
            </label>
          </div>

          {comments.map((comment) => (
            <CommentModerationCard
              key={comment.id}
              comment={comment}
              isSelected={selectedIds.includes(comment.id)}
              onSelectToggle={handleSelectToggle}
              onUpdateStatus={handleUpdateSingleStatus}
              onDelete={handleDeleteSingle}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <CommentsPagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteIds !== null}
        title={
          pendingDeleteIds && pendingDeleteIds.length > 1
            ? `Permanently delete ${pendingDeleteIds.length} comments?`
            : 'Permanently delete this comment?'
        }
        description="Deleted comments cannot be recovered. To hide a comment but keep it, reject it instead."
        confirmLabel="Delete permanently"
        busyLabel="Deleting…"
        isBusy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDeleteIds(null)}
      />
    </div>
  );
}
