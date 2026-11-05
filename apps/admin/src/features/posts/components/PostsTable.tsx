'use client';

import Link from 'next/link';
import { FileText, Loader2, Plus } from 'lucide-react';

import { useAdmin } from '@/lib/admin-context';

import type { PostsWorkspace } from '../hooks/usePostsWorkspace';
import { PostCard } from './PostCard';
import { PostsPagination } from './PostsPagination';
import { PostTableRow } from './PostTableRow';

type PostsTableProps = Pick<
  PostsWorkspace,
  | 'displayPosts'
  | 'sites'
  | 'isLoading'
  | 'isError'
  | 'refetch'
  | 'page'
  | 'setPage'
  | 'totalPages'
  | 'totalPosts'
  | 'openPublishing'
  | 'submitPublicationForReview'
  | 'removePost'
>;

/** Posts list with loading, empty, and populated states plus pagination. */
export function PostsTable({
  displayPosts,
  sites,
  isLoading,
  isError,
  refetch,
  page,
  setPage,
  totalPages,
  totalPosts,
  openPublishing,
  submitPublicationForReview,
  removePost,
}: PostsTableProps) {
  const { t } = useAdmin();

  const itemActions = {
    onPublishingAction: openPublishing,
    onSubmitForReview: submitPublicationForReview,
    onDelete: removePost,
  };

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      {isError ? (
        <div
          className="flex flex-col items-center justify-center p-16 gap-3 text-center"
          role="alert"
        >
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
            The posts could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3" role="status">
          <Loader2
            className="size-7 animate-spin text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Loading editorial content...
          </p>
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
          <FileText className="size-12 text-slate-300 dark:text-slate-700" aria-hidden="true" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {t.content.noPosts || 'No content found matching your filters.'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Get started by creating a new article, destination guide, or live event update.
          </p>
          <Link
            href="/posts/new"
            className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 text-brand-950 font-bold px-4 py-2 text-xs shadow-xs"
          >
            <Plus className="size-4 stroke-[2.5]" aria-hidden="true" />
            <span>{t.content.newPost}</span>
          </Link>
        </div>
      ) : (
        <>
          {/* Phones: a card list instead of a table that scrolls sideways. */}
          <ul
            className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60"
            aria-label={t.content.tableTitle || 'Posts'}
          >
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} sites={sites} {...itemActions} />
            ))}
          </ul>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th scope="col" className="py-3.5 px-6">
                    {t.content.tableTitle || 'Post & Summary'}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t.content.type || 'Content Type'}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t.content.publicationStatus || 'Site Publication'}
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    {t.content.updated || 'Last Updated'}
                  </th>
                  <th scope="col" className="py-3.5 px-6 text-right">
                    {t.content.actions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {displayPosts.map((post) => (
                  <PostTableRow key={post.id} post={post} sites={sites} {...itemActions} />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <PostsPagination
        page={page}
        totalPages={totalPages}
        totalPosts={totalPosts}
        onPageChange={setPage}
      />
    </div>
  );
}
