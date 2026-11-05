'use client';

import { useCallback, useMemo, useState } from 'react';
import type { PostPublicationItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
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

export interface WorkspaceNotice {
  tone: 'success' | 'error';
  text: string;
}

function errorMessage(err: unknown): string {
  const message = (err as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : 'Server error';
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
export function usePostsWorkspace() {
  const { activeSiteId } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [publishingTarget, setPublishingTarget] = useState<PublishingTarget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [notice, setNotice] = useState<WorkspaceNotice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setNotice({ tone: 'success', text: 'Submitted for review.' });
      refetch();
    } catch (err: unknown) {
      setNotice({ tone: 'error', text: `Review submission failed: ${errorMessage(err)}` });
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
      setNotice({ tone: 'success', text: `Deleted "${title}".` });
      refetch();
    } catch (err: unknown) {
      setNotice({ tone: 'error', text: `Failed to delete post: ${errorMessage(err)}` });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const dismissNotice = useCallback(() => setNotice(null), []);

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
    isLoading,
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
    notice,
    dismissNotice,
    publishingTarget,
    openPublishing,
    closePublishing: () => setPublishingTarget(null),
    submitPublicationForReview,
    removePost,
  };
}

export type PostsWorkspace = ReturnType<typeof usePostsWorkspace>;
