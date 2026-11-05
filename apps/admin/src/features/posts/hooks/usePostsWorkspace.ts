'use client';

import { useMemo, useState } from 'react';
import type { PostPublicationItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { useAdmin } from '@/lib/admin-context';
import {
  useDeletePostMutation,
  useListPostsQuery,
  useListSitesQuery,
  useSubmitForReviewMutation,
} from '@/lib/cms-api';

import { displayedPublication, effectiveStatus } from '../utils/post-display';

export const POSTS_PAGE_SIZE = 10;

export interface PostsStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  inReview: number;
  archived: number;
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
    limit: POSTS_PAGE_SIZE,
  });

  // Overview for the metric cards and tab counters, independent of the filters.
  // Known limitation: counts only the first 100 posts (see TECHNICAL_DEBT TD-12).
  const { data: statsOverviewData } = useListPostsQuery({
    siteId: activeSiteId || undefined,
    page: 1,
    limit: 100,
  });

  const [deletePost] = useDeletePostMutation();
  const [submitForReview] = useSubmitForReviewMutation();

  const posts = useMemo(() => postsData?.items ?? [], [postsData?.items]);
  const totalPosts = postsData?.total || posts.length;
  const totalPages = postsData?.totalPages || 1;

  // Match the effective publication status of the displayed site exactly.
  const displayPosts = useMemo(() => {
    if (!statusFilter) return posts;
    return posts.filter(
      (post) => effectiveStatus(post, displayedPublication(post, activeSiteId)) === statusFilter,
    );
  }, [posts, statusFilter, activeSiteId]);

  const stats = useMemo<PostsStats>(() => {
    const items = statsOverviewData?.items || posts;
    const counts = { published: 0, drafts: 0, scheduled: 0, inReview: 0, archived: 0 };
    for (const post of items) {
      const status = effectiveStatus(post, post.publications?.[0]);
      if (status === 'published') counts.published++;
      else if (status === 'draft') counts.drafts++;
      else if (status === 'scheduled') counts.scheduled++;
      else if (status === 'in_review') counts.inReview++;
      else if (status === 'archived') counts.archived++;
    }
    return { total: statsOverviewData?.total || items.length, ...counts };
  }, [statsOverviewData?.items, statsOverviewData?.total, posts]);

  const openPublishing = (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => {
    setPublishingTarget({ action, publication, title });
    setOpenDropdownId(null);
  };

  const submitPublicationForReview = async (publication: PostPublicationItem) => {
    try {
      await submitForReview({ siteId: publication.siteId, publicationId: publication.id }).unwrap();
      refetch();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert('Review submission failed: ' + (errorObj?.message || 'Server error'));
    }
  };

  const removePost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete post "${title}"?`)) return;
    try {
      await deletePost(postId).unwrap();
      refetch();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      alert('Failed to delete post: ' + (errorObj?.message || 'Server error'));
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
    displayPosts,
    stats,
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
    openDropdownId,
    toggleDropdown: (postId: string) =>
      setOpenDropdownId((current) => (current === postId ? null : postId)),
    publishingTarget,
    openPublishing,
    closePublishing: () => setPublishingTarget(null),
    submitPublicationForReview,
    removePost,
  };
}

export type PostsWorkspace = ReturnType<typeof usePostsWorkspace>;
