'use client';

import React from 'react';
import { Layers, Tag } from 'lucide-react';
import type { TaxonomyTab } from '../types';

interface TaxonomyTabsProps {
  activeTab: TaxonomyTab;
  onTabChange: (tab: TaxonomyTab) => void;
  categoriesCount: number;
  tagsCount: number;
}

export function TaxonomyTabs({
  activeTab,
  onTabChange,
  categoriesCount,
  tagsCount,
}: TaxonomyTabsProps) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
      {/* Categories Tab */}
      <button
        type="button"
        onClick={() => onTabChange('categories')}
        className={`pb-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
          activeTab === 'categories'
            ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Layers className="size-4" />
        <span>Categories</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'categories'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {categoriesCount}
        </span>
      </button>

      {/* Tags Tab */}
      <button
        type="button"
        onClick={() => onTabChange('tags')}
        className={`pb-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
          activeTab === 'tags'
            ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <Tag className="size-4" />
        <span>Tags</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'tags'
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {tagsCount}
        </span>
      </button>
    </div>
  );
}
