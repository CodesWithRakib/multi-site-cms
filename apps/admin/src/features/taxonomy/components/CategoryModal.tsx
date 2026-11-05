'use client';

import React, { useState } from 'react';
import { X, Folder, Loader2 } from 'lucide-react';
import type { CategoryItem } from '@multi-site-cms/types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: CategoryItem | null;
  initialParentId?: string | null;
  availableCategories: CategoryItem[];
  onSave: (payload: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    displayOrder: number;
  }) => Promise<void>;
  isSaving: boolean;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function CategoryModal({
  isOpen,
  onClose,
  editingCategory,
  initialParentId,
  availableCategories,
  onSave,
  isSaving,
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <CategoryModalContent
      key={`${editingCategory?.id || 'new'}-${initialParentId || 'root'}`}
      onClose={onClose}
      editingCategory={editingCategory}
      initialParentId={initialParentId}
      availableCategories={availableCategories}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

interface ContentProps {
  onClose: () => void;
  editingCategory: CategoryItem | null;
  initialParentId?: string | null;
  availableCategories: CategoryItem[];
  onSave: (payload: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    displayOrder: number;
  }) => Promise<void>;
  isSaving: boolean;
}

function CategoryModalContent({
  onClose,
  editingCategory,
  initialParentId,
  availableCategories,
  onSave,
  isSaving,
}: ContentProps) {
  const [name, setName] = useState(editingCategory?.name || '');
  const [slug, setSlug] = useState(editingCategory?.slug || '');
  const [description, setDescription] = useState(editingCategory?.description || '');
  const [parentId, setParentId] = useState<string>(
    editingCategory?.parentId || initialParentId || '',
  );
  const [displayOrder, setDisplayOrder] = useState<number>(editingCategory?.displayOrder || 0);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(editingCategory));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || undefined,
        parentId: parentId || null,
        displayOrder: Number(displayOrder) || 0,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Failed to save category.');
    }
  };

  // Prevent selecting self as parent
  const parentCandidates = availableCategories.filter(
    (c) => !editingCategory || c.id !== editingCategory.id,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Folder className="size-5" />
            </div>
            <div>
              <h3
                id="category-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize site publications in hierarchical taxonomy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Adventure Guides"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Slug Identifier
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setIsSlugManuallyEdited(true);
              }}
              placeholder="adventure-guides"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Parent Category & Display Order Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Parent Category (Optional)
              </label>
              <select
                aria-label="Parent category"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">None (Top-Level Category)</option>
                {parentCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Display Order
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of articles grouped under this category..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-400 to-brand-300 hover:from-brand-500 hover:to-brand-400 text-brand-950 shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

