'use client';

import Link from 'next/link';
import type { PostItem, PostPublicationItem, SiteItem } from '@multi-site-cms/types';

import type { PublishingActionType } from '@/features/posts/components/PublishingModal';

import { usePostRowModel } from '../hooks/usePostRowModel';
import { PostRowActions } from './PostRowActions';
import { PostStatusCell } from './PostStatusCell';
import { PostThumbnail } from './PostThumbnail';
import { PostTypeBadge } from './PostTypeBadge';

export interface PostListItemProps {
  readonly post: PostItem;
  readonly sites: SiteItem[];
  readonly onPublishingAction: (
    action: PublishingActionType,
    publication: PostPublicationItem,
    title: string,
  ) => void;
  readonly onSubmitForReview: (publication: PostPublicationItem) => void;
  readonly onDelete: (postId: string, title: string) => void;
}

/** One post in the desktop table (`md` and up). */
export function PostTableRow({ post, sites, ...actions }: PostListItemProps) {
  const row = usePostRowModel(post, sites);

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group">
      <td className="py-4 px-6 max-w-md">
        <div className="flex items-center gap-3.5">
          <PostThumbnail kind={row.kind} />
          <div className="flex flex-col min-w-0">
            <Link
              href={`/posts/${post.id}/edit`}
              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors line-clamp-1"
            >
              {row.title}
            </Link>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {row.excerpt}
            </p>
            {row.publication?.slug && (
              <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 mt-0.5">
                /{row.publication.slug}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <PostTypeBadge kind={row.kind} type={post.type} />
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <PostStatusCell
          status={row.status}
          publication={row.publication}
          site={row.site}
          liveUrl={row.liveUrl}
        />
      </td>

      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <div
            className="size-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0"
            aria-hidden="true"
          >
            {row.authorInitials}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
              {row.authorName}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {row.updatedLabel}
            </span>
          </div>
        </div>
      </td>

      <td className="py-4 px-6 whitespace-nowrap text-right">
        <PostRowActions
          postId={post.id}
          title={row.title}
          status={row.status}
          publication={row.publication}
          {...actions}
        />
      </td>
    </tr>
  );
}
