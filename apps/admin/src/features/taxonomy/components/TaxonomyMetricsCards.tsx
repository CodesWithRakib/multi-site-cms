'use client';

import React from 'react';
import { Layers, Tag, FolderTree, Globe } from 'lucide-react';

interface TaxonomyMetricsCardsProps {
  categoriesCount: number;
  tagsCount: number;
  hierarchyDepth: string;
  siteName: string;
}

export function TaxonomyMetricsCards({
  categoriesCount,
  tagsCount,
  hierarchyDepth,
  siteName,
}: TaxonomyMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Categories Count */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-emerald-500 to-teal-600">
            <Layers className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Categories
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {categoriesCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Tags Count */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-blue-500 to-indigo-600">
            <Tag className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Taxonomy Tags
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {tagsCount}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Hierarchy Depth */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-purple-500 to-violet-600">
            <FolderTree className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Hierarchy Depth
            </span>
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {hierarchyDepth}
            </h3>
          </div>
        </div>
      </div>

      {/* 4. Scoped Site */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-gradient-to-br from-amber-500 to-orange-600">
            <Globe className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Current Site Scope
            </span>
            <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]">
              {siteName}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

