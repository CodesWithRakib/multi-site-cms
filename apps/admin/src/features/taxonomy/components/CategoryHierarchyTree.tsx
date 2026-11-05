'use client';

import React from 'react';
import { Folder, Edit2, Trash2, Plus, ChevronRight, Layers } from 'lucide-react';
import type { CategoryItem } from '@multi-site-cms/types';

interface CategoryHierarchyTreeProps {
  categories: CategoryItem[];
  onEdit: (cat: CategoryItem) => void;
  onDelete: (cat: CategoryItem) => void;
  onAddSubcategory: (parentCat: CategoryItem) => void;
}

export function CategoryHierarchyTree({
  categories,
  onEdit,
  onDelete,
  onAddSubcategory,
}: CategoryHierarchyTreeProps) {
  // Build parent/children relationship
  const rootCategories = categories.filter((c) => !c.parentId);
  const childrenMap = new Map<string, CategoryItem[]>();

  categories.forEach((c) => {
    if (c.parentId) {
      const list = childrenMap.get(c.parentId) || [];
      list.push(c);
      childrenMap.set(c.parentId, list);
    }
  });

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-2xs">
        <Layers className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No categories found
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Create hierarchical categories to organize and group content publications across this
          site.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
      {rootCategories.map((rootCat) => {
        const subcategories = childrenMap.get(rootCat.id) || [];

        return (
          <div
            key={rootCat.id}
            className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
          >
            {/* Root Category Item Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Folder className="size-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {rootCat.name}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      /{rootCat.slug}
                    </span>
                    {typeof rootCat.displayOrder === 'number' && rootCat.displayOrder > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold">
                        Order: {rootCat.displayOrder}
                      </span>
                    )}
                  </div>
                  {rootCat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {rootCat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onAddSubcategory(rootCat)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                  title="Add child subcategory"
                >
                  <Plus className="size-3.5" />
                  <span>Subcategory</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(rootCat)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit category"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(rootCat)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete category"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Subcategories (Indented Tree) */}
            {subcategories.length > 0 && (
              <div className="ml-5 sm:ml-8 pl-4 border-l-2 border-emerald-500/20 dark:border-emerald-500/30 space-y-2 pt-1">
                {subcategories.map((subCat) => (
                  <div
                    key={subCat.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <ChevronRight className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {subCat.name}
                          </span>
                          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                            /{subCat.slug}
                          </span>
                        </div>
                        {subCat.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {subCat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onEdit(subCat)}
                        className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title="Edit subcategory"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(subCat)}
                        className="p-1 rounded-md text-rose-400 hover:text-rose-600 transition-colors"
                        title="Delete subcategory"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
