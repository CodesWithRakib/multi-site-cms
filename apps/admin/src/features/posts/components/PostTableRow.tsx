'use client';

import Link from 'next/link';
import type { PostItem, PostPublicationItem, SiteItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';
import { useAdmin } from '@/lib/admin-context';
import { formatDateTime } from '@/lib/i18n';

import {
  displayedPublication,
  effectiveStatus,
  initials,
  postKind,
  publicationLiveUrl,
} from '../utils/post-display';
import { PostRowActions } from './PostRowActions';
import { PostStatusCell } from './PostStatusCell';
import { PostThumbnail } from './PostThumbnail';

const KIND_BADGE: Record<ReturnType<typeof postKind>, string> = {
  travel:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
  air: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/80',
  other:
    'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80',
};

interface PostTableRowProps {
  readonly post: PostItem;
  readonly sites: SiteItem[];
  readonly isMenuOpen: boolean;
  readonly onToggleMenu: () => void;
  readonly onPublishingAction: (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => void;
  readonly onSubmitForReview: (publication: PostPublicationItem) => void;
  readonly onDelete: (postId: string, title: string) => void;
}

export function PostTableRow({ post, sites, ...actions }: PostTableRowProps) {
  const { locale, activeSiteId, activeSite } = useAdmin();
  const timezone = activeSite?.timezone || 'UTC';

  const pub = displayedPublication(post, activeSiteId);
  const status = effectiveStatus(post, pub);
  const kind = postKind(post.type);
  const site = sites.find((candidate) => candidate.id === pub?.siteId);
  const title = post.currentRevision?.title || 'Untitled Post';
  const excerpt = post.currentRevision?.excerpt || 'No excerpt provided.';
  const authorName = post.author?.displayName ?? 'Unknown author';

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
      <td className="py-4 px-6 max-w-md">
        <div className="flex items-center gap-3.5">
          <PostThumbnail kind={kind} postId={post.id} />
          <div className="flex flex-col min-w-0">
            <Link
              href={`/posts/${post.id}/edit`}
              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors line-clamp-1"
            >
              {title}
            </Link>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {excerpt}
            </p>
            {pub?.slug && (
              <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                /{pub.slug}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${KIND_BADGE[kind]}`}
        >
          {post.type.replace('_', ' ')}
        </span>
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <PostStatusCell
          status={status}
          publication={pub}
          site={site}
          liveUrl={publicationLiveUrl(site, pub)}
        />
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div
            className="size-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {initials(authorName)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {authorName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {formatDateTime(post.updatedAt, locale, timezone)}
            </span>
          </div>
        </div>
      </td>

      <td className="py-4 px-6 whitespace-nowrap text-right">
        <PostRowActions
          postId={post.id}
          title={title}
          status={status}
          publication={pub}
          {...actions}
        />
      </td>
    </tr>
  );
}
