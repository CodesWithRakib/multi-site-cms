'use client';

import { useMemo, useState } from 'react';
import type { PostPublicationItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { useActionNotice } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/api-error';
import { useAdmin } from '@/lib/admin-context';
import {
  useDeletePostMutation,
  useGetPostStatsQuery,
  useListPostsQuery,
  useListSitesQuery,
  useSubmitForReviewMutation,
} from '@/lib/cms-api';

export const POSTS_PAGE_SIZE = 10;

export interface PostsStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  inReview: number;
  archived: number;
}

export interface PendingDelete {
  postId: string;
  title: string;
}

export interface PublishingTarget {
  action: PublishingActionType;
  publication: PostPublicationItem;
  title: string;
}

/**
 * State, data, and actions of the posts workspace. The page only composes
 * presentation components around this hook.
 */
export function usePostsWorkspace(initialSearch = '') {
  const { activeSiteId } = useAdmin();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [publishingTarget, setPublishingTarget] = useState<PublishingTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const notices = useActionNotice();
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: sites = [] } = useListSitesQuery();
  const {
    // currentData belongs to the current filters only. `data` would keep the
    // previous filter's rows on screen while loading or after an error.
    currentData: postsData,
    isFetching,
    isError,
    refetch,
  } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    search: searchTerm.trim() || undefined,
    page,
    limit: POSTS_PAGE_SIZE,
  });

  // Metric cards and tab counters: counted by the API over every visible post,
  // with the same status rule as the list filter, independent of the filters.
  const { data: statusCounts, isLoading: isStatsLoading } = useGetPostStatsQuery({
    siteId: activeSiteId || undefined,
  });

  const [deletePost] = useDeletePostMutation();
  const [submitForReview] = useSubmitForReviewMutation();

  const posts = useMemo(() => postsData?.items ?? [], [postsData?.items]);
  const totalPosts = postsData?.total || posts.length;
  const totalPages = postsData?.totalPages || 1;

  const stats = useMemo<PostsStats>(() => {
    const byStatus = statusCounts?.byStatus;
    return {
      total: statusCounts?.total ?? 0,
      published: byStatus?.published ?? 0,
      drafts: byStatus?.draft ?? 0,
      scheduled: byStatus?.scheduled ?? 0,
      inReview: byStatus?.in_review ?? 0,
      archived: byStatus?.archived ?? 0,
    };
  }, [statusCounts]);

  const openPublishing = (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => {
    setPublishingTarget({ action, publication, title });
  };

  const submitPublicationForReview = async (publication: PostPublicationItem) => {
    try {
      await submitForReview({ siteId: publication.siteId, publicationId: publication.id }).unwrap();
      notices.success('Submitted for review.');
      refetch();
    } catch (err: unknown) {
      notices.error(`Review submission failed: ${apiErrorMessage(err, 'Server error')}`);
    }
  };

  /** Step 1: ask for confirmation (rendered as an AlertDialog). */
  const removePost = (postId: string, title: string) => setPendingDelete({ postId, title });

  /** Step 2: the user confirmed. */
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { postId, title } = pendingDelete;
    setIsDeleting(true);
    try {
      await deletePost(postId).unwrap();
      notices.success(`Deleted "${title}".`);
      refetch();
    } catch (err: unknown) {
      notices.error(`Failed to delete post: ${apiErrorMessage(err, 'Server error')}`);
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  /** Any filter change returns to the first page. */
  const withPageReset =
    <T>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return {
    sites,
    // The API applies the status filter with the same rule as the counts.
    displayPosts: posts,
    stats,
    isStatsLoading,
    /** No rows for the current filters yet (first load or a filter change). */
    isLoading: isFetching && !postsData,
    isError: isError && !postsData,
    isFetching,
    refetch,
    page,
    setPage,
    totalPages,
    totalPosts,
    filters: { searchTerm, typeFilter, statusFilter },
    setSearchTerm: withPageReset(setSearchTerm),
    setTypeFilter: withPageReset(setTypeFilter),
    setStatusFilter: withPageReset(setStatusFilter),
    hasActiveFilters: Boolean(searchTerm || typeFilter || statusFilter),
    clearFilters,
    pendingDelete,
    isDeleting,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete,
    notice: notices.notice,
    dismissNotice: notices.dismiss,
    publishingTarget,
    openPublishing,
    closePublishing: () => setPublishingTarget(null),
    submitPublicationForReview,
    removePost,
  };
}

export type PostsWorkspace = ReturnType<typeof usePostsWorkspace>;
