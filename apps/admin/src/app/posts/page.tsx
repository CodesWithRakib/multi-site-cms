'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Loader2, FileText } from 'lucide-react';
import type { PostItem, PostPublicationItem } from '@multi-site-cms/types';
import { useDeletePostMutation, useListPostsQuery } from '@/lib/cms-api';

export default function PostsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: postsData, isLoading } = useListPostsQuery({
    search: searchTerm.trim() || undefined,
    type: typeFilter || undefined,
    page,
    limit: 10,
  });

  const [deletePost] = useDeletePostMutation();

  const handleDelete = async (postId: string, title: string) => {
    if (confirm(`Are you sure you want to archive post "${title}"?`)) {
      try {
        await deletePost(postId).unwrap();
      } catch (err) {
        alert('Failed to archive post: ' + ((err as Error).message || 'Server error'));
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Posts & Editorial Content
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Canonical content items published across Travel Blog and Air Sports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/media"
            className="flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            Media Library
          </Link>
          <Link
            href="/posts/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search posts by title..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="">All Content Types</option>
          <option value="article">Standard Article</option>
          <option value="travel_guide">Travel Guide</option>
          <option value="air_sports_update">Air Sports Update</option>
          <option value="event_update">Event Update</option>
          <option value="news">News</option>
          <option value="live_update">Live Update</option>
        </select>
      </div>

      {/* Posts Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs">Loading posts...</span>
          </div>
        ) : postsData?.items && postsData.items.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Title & Excerpt</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Revision</th>
                <th className="px-4 py-3.5">Publications</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {postsData.items.map((post: PostItem) => {
                const currentRev = post.currentRevision;
                return (
                  <tr
                    key={post.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                      >
                        {currentRev?.title || 'Untitled Post'}
                      </Link>
                      {currentRev?.excerpt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-md">
                          {currentRev.excerpt}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {post.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-mono">
                      v{currentRev?.revisionNumber || post.currentRevisionNumber || 1}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs">
                      {post.publications && post.publications.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.publications.map((pub: PostPublicationItem) => (
                            <span
                              key={pub.id}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            >
                              /{pub.slug}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Draft only</span>
                      )}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/posts/${post.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id, currentRev?.title || 'this post')}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Archive Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No posts found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Get started by creating your first article or destination guide.
            </p>
            <Link
              href="/posts/new"
              className="mt-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
