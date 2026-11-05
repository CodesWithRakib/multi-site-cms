'use client';

import type { PostItem, SiteItem } from '@multi-site-cms/types';

import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';

import {
  displayedPublication,
  effectiveStatus,
  initials,
  postKind,
  publicationLiveUrl,
} from '../utils/post-display';

/**
 * Display data of one post in the workspace list. Shared by the desktop table
 * row and the phone card so both always show the same thing.
 */
export function usePostRowModel(post: PostItem, sites: SiteItem[]) {
  const { locale, activeSiteId, activeSite } = useAdmin();

  const publication = displayedPublication(post, activeSiteId);
  const site = sites.find((candidate) => candidate.id === publication?.siteId);
  const authorName = post.author?.displayName ?? 'Unknown author';

  return {
    publication,
    site,
    status: effectiveStatus(post, publication),
    kind: postKind(post.type),
    title: post.currentRevision?.title || 'Untitled Post',
    excerpt: post.currentRevision?.excerpt || 'No excerpt provided.',
    authorName,
    authorInitials: initials(authorName),
    updatedLabel: formatDateTime(post.updatedAt, locale, activeSite?.timezone || 'UTC'),
    liveUrl: publicationLiveUrl(site, publication),
  };
}

export type PostRowModel = ReturnType<typeof usePostRowModel>;
