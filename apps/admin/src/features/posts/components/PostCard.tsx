'use client';

import Link from 'next/link';

import { usePostRowModel } from '../hooks/usePostRowModel';
import { PostRowActions } from './PostRowActions';
import { PostStatusCell } from './PostStatusCell';
import { PostThumbnail } from './PostThumbnail';
import type { PostListItemProps } from './PostTableRow';
import { PostTypeBadge } from './PostTypeBadge';

/**
 * One post as a phone card (below `md`), replacing the wide table that
 * scrolled sideways. Same data and actions as `PostTableRow`.
 */
export function PostCard({ post, sites, ...actions }: PostListItemProps) {
  const row = usePostRowModel(post, sites);

  return (
    <li className="p-4">
      <article className="flex flex-col gap-3" aria-label={row.title}>
        <div className="flex items-start gap-3">
          <PostThumbnail kind={row.kind} />
          <div className="flex flex-col min-w-0 flex-1">
            <Link
              href={`/posts/${post.id}/edit`}
              className="font-bold text-sm text-slate-900 dark:text-white hover:text-emerald-600 transition-colors line-clamp-2"
            >
              {row.title}
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {row.excerpt}
            </p>
          </div>
          <PostRowActions
            postId={post.id}
            title={row.title}
            status={row.status}
            publication={row.publication}
            {...actions}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PostTypeBadge kind={row.kind} type={post.type} />
          <PostStatusCell
            status={row.status}
            publication={row.publication}
            site={row.site}
            liveUrl={row.liveUrl}
          />
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{row.authorName}</span>{' '}
          · {row.updatedLabel}
        </p>
      </article>
    </li>
  );
}
