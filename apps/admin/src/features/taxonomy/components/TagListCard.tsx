'use client';

import React from 'react';
import { Tag, Edit2, Trash2, Hash } from 'lucide-react';
import type { TagItem } from '@multi-site-cms/types';

interface TagListCardProps {
  tags: TagItem[];
  onEdit: (tag: TagItem) => void;
  onDelete: (tag: TagItem) => void;
}

export function TagListCard({ tags, onEdit, onDelete }: TagListCardProps) {
  if (tags.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-2xs">
        <Tag className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No tags found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Create classification tags for indexing, SEO keywords, and topic cross-referencing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Hash className="size-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {tag.name}
                </h4>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold truncate">
                #{tag.slug}
              </span>
            </div>

            {tag.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                {tag.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => onEdit(tag)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Edit tag"
            >
              <Edit2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(tag)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Delete tag"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

