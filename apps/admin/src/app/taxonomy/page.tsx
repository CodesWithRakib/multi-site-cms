'use client';

import React, { useState } from 'react';
import {
  Tag as TagIcon,
  FolderTree,
  Plus,
  Trash2,
  Edit2,
  Folder,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { useAdmin } from '@/lib/admin-context';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListTagsQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
} from '@/lib/cms-api';
import type { CategoryItem, TagItem } from '@multi-site-cms/types';

export default function TaxonomyPage() {
  const { t, activeSiteId, activeSite, availableSites, setActiveSiteId } = useAdmin();

  // Active Tab: 'categories' | 'tags'
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryParentId, setCategoryParentId] = useState<string>('');
  const [categoryDisplayOrder, setCategoryDisplayOrder] = useState<number>(0);

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagSlug, setTagSlug] = useState('');
  const [tagDescription, setTagDescription] = useState('');

  // Status message
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Effective Site ID
  const effectiveSiteId =
    activeSiteId || (availableSites.length > 0 ? availableSites[0]?.id : null);

  // Queries
  const {
    data: categories,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useListCategoriesQuery(effectiveSiteId || '', { skip: !effectiveSiteId });

  const {
    data: tags,
    isLoading: isLoadingTags,
    error: tagsError,
    refetch: refetchTags,
  } = useListTagsQuery(effectiveSiteId || '', { skip: !effectiveSiteId });

  // Mutations
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeletingCategory }] = useDeleteCategoryMutation();

  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();
  const [deleteTag, { isLoading: isDeletingTag }] = useDeleteTagMutation();

  // Slug auto-generation helper
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategorySlug('');
    setCategoryDescription('');
    setCategoryParentId('');
    setCategoryDisplayOrder(0);
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySlug(cat.slug);
    setCategoryDescription(cat.description || '');
    setCategoryParentId(cat.parentId || '');
    setCategoryDisplayOrder(cat.displayOrder || 0);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSiteId) return;
    setActionMessage(null);

    try {
      if (editingCategory) {
        await updateCategory({
          siteId: effectiveSiteId,
          categoryId: editingCategory.id,
          data: {
            name: categoryName.trim(),
            slug: categorySlug.trim() || slugify(categoryName),
            description: categoryDescription.trim() || undefined,
            parentId: categoryParentId || null,
            displayOrder: Number(categoryDisplayOrder) || 0,
          },
        }).unwrap();
        setActionMessage({ type: 'success', text: `Category "${categoryName}" updated.` });
      } else {
        await createCategory({
          siteId: effectiveSiteId,
          data: {
            name: categoryName.trim(),
            slug: categorySlug.trim() || slugify(categoryName),
            description: categoryDescription.trim() || undefined,
            parentId: categoryParentId || undefined,
            displayOrder: Number(categoryDisplayOrder) || 0,
          },
        }).unwrap();
        setActionMessage({ type: 'success', text: `Category "${categoryName}" created.` });
      }

      setIsCategoryModalOpen(false);
      refetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to save category.',
      });
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!effectiveSiteId) return;
    if (!window.confirm(`Delete category "${cat.name}"? Subcategories or posts may be affected.`)) {
      return;
    }

    setActionMessage(null);
    try {
      await deleteCategory({ siteId: effectiveSiteId, categoryId: cat.id }).unwrap();
      setActionMessage({ type: 'success', text: `Category "${cat.name}" deleted.` });
      refetchCategories();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to delete category.',
      });
    }
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSiteId) return;
    setActionMessage(null);

    try {
      await createTag({
        siteId: effectiveSiteId,
        data: {
          name: tagName.trim(),
          slug: tagSlug.trim() || slugify(tagName),
          description: tagDescription.trim() || undefined,
        },
      }).unwrap();

      setIsTagModalOpen(false);
      setTagName('');
      setTagSlug('');
      setTagDescription('');
      setActionMessage({ type: 'success', text: `Tag "${tagName}" created.` });
      refetchTags();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to create tag.',
      });
    }
  };

  const handleDeleteTag = async (tag: TagItem) => {
    if (!effectiveSiteId) return;
    if (!window.confirm(`Delete tag "${tag.name}"?`)) return;

    setActionMessage(null);
    try {
      await deleteTag({ siteId: effectiveSiteId, tagId: tag.id }).unwrap();
      setActionMessage({ type: 'success', text: `Tag "${tag.name}" deleted.` });
      refetchTags();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: { message?: string } }; message?: string };
      setActionMessage({
        type: 'error',
        text: apiErr?.data?.error?.message || apiErr?.message || 'Failed to delete tag.',
      });
    }
  };

  // Build category hierarchy: top-level categories and map of children
  const rootCategories = React.useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const childrenMap = React.useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    categories?.forEach((c) => {
      if (c.parentId) {
        const list = map.get(c.parentId) || [];
        list.push(c);
        map.set(c.parentId, list);
      }
    });
    return map;
  }, [categories]);

  return (
    <ShellLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t('taxonomy.title')}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('taxonomy.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'categories' ? (
              <button
                onClick={openCreateCategory}
                disabled={!effectiveSiteId}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('taxonomy.newCategory')}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setTagName('');
                  setTagSlug('');
                  setTagDescription('');
                  setIsTagModalOpen(true);
                }}
                disabled={!effectiveSiteId}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{t('taxonomy.newTag')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Site Scoping Indicator & Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Active Site Scope:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableSites.map((site) => (
                <button
                  key={site.id}
                  onClick={() => setActiveSiteId(site.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    effectiveSiteId === site.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {site.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{t('taxonomy.categories')}</span>
              {categories && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
                  {categories.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tags')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'tags'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <TagIcon className="w-3.5 h-3.5" />
              <span>{t('taxonomy.tags')}</span>
              {tags && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
                  {tags.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {actionMessage && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'categories' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {isLoadingCategories ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs">Loading taxonomy categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="p-8 text-center text-rose-600 text-sm">
                Failed to load categories for this website.
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <Folder className="w-8 h-8 text-slate-300" />
                <p>No categories defined for this site yet.</p>
                <button
                  onClick={openCreateCategory}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Create the first category
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rootCategories.map((root) => {
                  const children = childrenMap.get(root.id) || [];
                  return (
                    <div key={root.id} className="p-4 flex flex-col gap-3">
                      {/* Root Category Row */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Folder className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {root.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                /{root.slug}
                              </span>
                            </div>
                            {root.description && (
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {root.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => openEditCategory(root)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(root)}
                            disabled={isDeletingCategory}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories (Indented) */}
                      {children.length > 0 && (
                        <div className="ml-6 pl-4 border-l-2 border-indigo-100 dark:border-indigo-950 flex flex-col gap-2 pt-1">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                                      {child.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      /{child.slug}
                                    </span>
                                  </div>
                                  {child.description && (
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {child.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openEditCategory(child)}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(child)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            )}
          </div>
        ) : (
          /* Tags Tab */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
            {isLoadingTags ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs">Loading tags...</span>
              </div>
            ) : tagsError ? (
              <div className="p-8 text-center text-rose-600 text-sm">
                Failed to load tags for this website.
              </div>
            ) : !tags || tags.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <TagIcon className="w-8 h-8 text-slate-300" />
                <p>No tags created for this site yet.</p>
                <button
                  onClick={() => setIsTagModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Create the first tag
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-300 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TagIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                          {tag.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 truncate block">
                          #{tag.slug}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTag(tag)}
                      disabled={isDeletingTag}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Create/Edit Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                {editingCategory ? 'Edit Category' : t('taxonomy.newCategory')}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Define taxonomic grouping for {activeSite?.name || 'this website'}.
              </p>

              <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      if (!editingCategory) setCategorySlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Destination Guides"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.slug')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    placeholder="destination-guides"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.parentCategory')}
                  </label>
                  <select
                    value={categoryParentId}
                    onChange={(e) => setCategoryParentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      ?.filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.description')}
                  </label>
                  <textarea
                    rows={2}
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Editorial purpose of this category..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.displayOrder')}
                  </label>
                  <input
                    type="number"
                    value={categoryDisplayOrder}
                    onChange={(e) => setCategoryDisplayOrder(Number(e.target.value))}
                    className="w-24 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCategory || isUpdatingCategory}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    {isCreatingCategory || isUpdatingCategory ? 'Saving...' : t('actions.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tag Create Modal */}
        {isTagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                {t('taxonomy.newTag')}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Add an organizational tag for {activeSite?.name || 'this website'}.
              </p>

              <form onSubmit={handleSaveTag} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={tagName}
                    onChange={(e) => {
                      setTagName(e.target.value);
                      setTagSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Paragliding World Cup"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.slug')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={tagSlug}
                    onChange={(e) => setTagSlug(e.target.value)}
                    placeholder="paragliding-world-cup"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {t('taxonomy.description')}
                  </label>
                  <textarea
                    rows={2}
                    value={tagDescription}
                    onChange={(e) => setTagDescription(e.target.value)}
                    placeholder="Optional tag description..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(false)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTag}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
                  >
                    {isCreatingTag ? 'Creating...' : t('actions.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
