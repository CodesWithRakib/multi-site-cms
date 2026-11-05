'use client';

import React, { useState } from 'react';
import { X, Tag, Loader2 } from 'lucide-react';
import type { TagItem } from '@multi-site-cms/types';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTag: TagItem | null;
  onSave: (payload: { name: string; slug: string; description?: string }) => Promise<void>;
  isSaving: boolean;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function TagModal({ isOpen, onClose, editingTag, onSave, isSaving }: TagModalProps) {
  if (!isOpen) return null;

  return (
    <TagModalContent
      key={editingTag?.id || 'new'}
      onClose={onClose}
      editingTag={editingTag}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

interface ContentProps {
  onClose: () => void;
  editingTag: TagItem | null;
  onSave: (payload: { name: string; slug: string; description?: string }) => Promise<void>;
  isSaving: boolean;
}

function TagModalContent({ onClose, editingTag, onSave, isSaving }: ContentProps) {
  const [name, setName] = useState(editingTag?.name || '');
  const [slug, setSlug] = useState(editingTag?.slug || '');
  const [description, setDescription] = useState(editingTag?.description || '');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(editingTag));
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
      setErrorMsg('Tag name is required.');
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { data?: { error?: { message?: string } }; message?: string };
      setErrorMsg(errorObj?.data?.error?.message || errorObj?.message || 'Failed to save tag.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Tag className="size-5" />
            </div>
            <div>
              <h3 id="tag-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Classification tag for SEO keywords and topics
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
              Tag Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Paragliding Gear"
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
              placeholder="paragliding-gear"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            />
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
              placeholder="Brief context about this tag..."
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
                <span>{editingTag ? 'Update Tag' : 'Create Tag'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

