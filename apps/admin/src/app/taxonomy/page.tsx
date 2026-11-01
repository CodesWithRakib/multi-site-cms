'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  RefreshCw,
  Search,
  X,
  Layers,
  FileText,
  ArrowUp,
  Hash,
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: synchronize ?tab=tags without cascading render effects
  const tabParam = searchParams.get('tab') === 'tags' ? 'tags' : 'categories';
  const [internalTab, setInternalTab] = useState<'categories' | 'tags' | null>(null);
  const activeTab = internalTab ?? tabParam;

  const handleTabChange = (tab: 'categories' | 'tags') => {
    setInternalTab(tab);
    router.replace(`/taxonomy${tab === 'tags' ? '?tab=tags' : ''}`);
  };

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

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
    data: categories = [],
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useListCategoriesQuery(effectiveSiteId || '', { skip: !effectiveSiteId });

  const {
    data: tags = [],
    isLoading: isLoadingTags,
    isFetching: isFetchingTags,
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
    if (!window.confirm(`Delete category "${cat.name}"? Subcategories may be affected.`)) return;

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

  // Safe arrays
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const safeTags = useMemo(() => (Array.isArray(tags) ? tags : []), [tags]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return safeCategories;
    const term = searchTerm.toLowerCase();
    return safeCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.slug.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term),
    );
  }, [safeCategories, searchTerm]);

  // Hierarchy mapping
  const rootCategories = useMemo(() => {
    return filteredCategories.filter((c) => !c.parentId);
  }, [filteredCategories]);

  const childrenMap = useMemo(() => {
    const map = new Map<string, CategoryItem[]>();
    filteredCategories.forEach((c) => {
      if (c.parentId) {
        const list = map.get(c.parentId) || [];
        list.push(c);
        map.set(c.parentId, list);
      }
    });
    return map;
  }, [filteredCategories]);

  // Filtered tags
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return safeTags;
    const term = searchTerm.toLowerCase();
    return safeTags.filter(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        t.slug.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term),
    );
  }, [safeTags, searchTerm]);

  // Compute hierarchy depth
  const hierarchyDepth = useMemo(() => {
    const hasChildren = safeCategories.some((c) => Boolean(c.parentId));
    return hasChildren ? '2 Levels' : 'Flat';
  }, [safeCategories]);

  const isFetchingAny = isFetchingCategories || isFetchingTags;
  const currentSiteName =
    activeSite?.name ||
    availableSites.find((s) => s.id === effectiveSiteId)?.name ||
    'Select Site';

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        {/* 1. Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t.taxonomy.title || 'Site Taxonomy Management'}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentSiteName}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.taxonomy.subtitle ||
                'Hierarchical categories and classification tags scoped to this site.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => {
                refetchCategories();
                refetchTags();
              }}
              disabled={isFetchingAny}
              title="Refresh taxonomy"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isFetchingAny ? 'animate-spin text-emerald-500' : ''}`} />
            </button>

            {/* CTA: New Category or New Tag */}
            {activeTab === 'categories' ? (
              <button
                type="button"
                onClick={openCreateCategory}
                disabled={!effectiveSiteId}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] font-bold px-4 py-2 text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>{t.taxonomy.newCategory || 'New Category'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTagName('');
                  setTagSlug('');
                  setTagDescription('');
                  setIsTagModalOpen(true);
                }}
                disabled={!effectiveSiteId}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] font-bold px-4 py-2 text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>{t.taxonomy.newTag || 'New Tag'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Categories Count */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
                  <FolderTree className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t.taxonomy.categories || 'Categories'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {safeCategories.length}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUp className="size-2.5 mr-0.5" /> Scoped
                    </span>
                  </div>
                </div>
              </div>
              <svg className="w-16 h-8 text-blue-500/70" viewBox="0 0 100 40" fill="none">
                <path
                  d="M0 25 C20 28, 40 10, 60 18 C80 25, 90 8, 100 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Tags Count */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 shadow-2xs">
                  <TagIcon className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t.taxonomy.tags || 'Tags'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {safeTags.length}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Classification
                    </span>
                  </div>
                </div>
              </div>
              <svg className="w-16 h-8 text-emerald-500/70" viewBox="0 0 100 40" fill="none">
                <path
                  d="M0 30 C20 18, 40 22, 60 12 C80 8, 90 14, 100 8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Hierarchy Depth */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 shadow-2xs">
                  <Layers className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t.taxonomy.hierarchyDepth || 'Hierarchy Depth'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      {hierarchyDepth}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {rootCategories.length} Root
                    </span>
                  </div>
                </div>
              </div>
              <svg className="w-16 h-8 text-amber-500/70" viewBox="0 0 100 40" fill="none">
                <path
                  d="M0 28 C25 24, 45 32, 65 20 C85 10, 95 16, 100 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Tenant Scope */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60 shadow-2xs">
                  <FileText className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {t.taxonomy.activeScope || 'Active Scope'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                      {currentSiteName}
                    </span>
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      Tenant-scoped
                    </span>
                  </div>
                </div>
              </div>
              <svg className="w-16 h-8 text-purple-500/70" viewBox="0 0 100 40" fill="none">
                <path
                  d="M0 25 C20 20, 45 28, 65 14 C85 8, 92 12, 100 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. Site Scoping & Tab Selector Control Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          {/* Site Scope Pill Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
              <Globe className="size-3.5 text-slate-400 shrink-0" />
              <span>{t.taxonomy.activeScope || 'Website Scope'}:</span>
            </div>
            {availableSites.map((site) => {
              const isSelected = effectiveSiteId === site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setActiveSiteId(site.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  {site.name}
                </button>
              );
            })}
          </div>

          {/* Categories vs Tags Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => handleTabChange('categories')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderTree className="size-3.5" />
              <span>{t.taxonomy.categories || 'Categories'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {safeCategories.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('tags')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tags'
                  ? 'bg-white dark:bg-slate-900 text-[#072423] dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TagIcon className="size-3.5" />
              <span>{t.taxonomy.tags || 'Tags'}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {safeTags.length}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Filter & Search Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.taxonomy.searchPlaceholder || 'Search categories and tags by name or slug...'}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5. Feedback Notifications */}
        {actionMessage && (
          <div
            className={`flex items-center gap-3 p-3.5 rounded-xl text-xs font-semibold border shadow-2xs ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* 6. Main Content Area */}
        {activeTab === 'categories' ? (
          /* Categories Tab */
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            {isLoadingCategories ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="size-7 animate-spin text-emerald-500" />
                <span className="text-xs font-semibold">Loading taxonomy categories...</span>
              </div>
            ) : categoriesError ? (
              <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-xs">
                Failed to load categories for this website.
              </div>
            ) : rootCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
                <Folder className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t.taxonomy.noCategoriesFound || 'No categories defined for this site yet.'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Create categories to organize destination guides, race reports, and articles.
                </p>
                <button
                  type="button"
                  onClick={openCreateCategory}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] font-bold px-4 py-2 text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>{t.taxonomy.newCategory || 'Create Category'}</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {rootCategories.map((root) => {
                  const children = childrenMap.get(root.id) || [];
                  return (
                    <div key={root.id} className="p-4.5 flex flex-col gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Root Category Row */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/60 shadow-2xs shrink-0">
                            <Folder className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {root.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
                                /{root.slug}
                              </span>
                              {root.displayOrder > 0 && (
                                <span className="text-[10px] font-semibold text-slate-400">
                                  Order: {root.displayOrder}
                                </span>
                              )}
                            </div>
                            {root.description ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {root.description}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic mt-0.5">
                                No description specified
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditCategory(root)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-colors cursor-pointer"
                            title={t.taxonomy.editCategory || 'Edit Category'}
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(root)}
                            disabled={isDeletingCategory}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories (Nested) */}
                      {children.length > 0 && (
                        <div className="ml-5 pl-5 border-l-2 border-emerald-200 dark:border-emerald-900/60 flex flex-col gap-2 pt-1">
                          {children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ChevronRight className="size-3.5 text-emerald-500 shrink-0" />
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

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditCategory(child)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                                  title="Edit subcategory"
                                >
                                  <Edit2 className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(child)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                  title="Delete subcategory"
                                >
                                  <Trash2 className="size-3.5" />
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
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <TagIcon className="size-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t.taxonomy.tags || 'Classification Tags'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Flat non-hierarchical keyword tokens used across publication articles.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {filteredTags.length} {filteredTags.length === 1 ? 'Tag' : 'Tags'}
              </span>
            </div>

            {isLoadingTags ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <Loader2 className="size-7 animate-spin text-emerald-500" />
                <span className="text-xs font-semibold">Loading classification tags...</span>
              </div>
            ) : tagsError ? (
              <div className="p-12 text-center text-rose-600 dark:text-rose-400 text-xs">
                Failed to load tags for this website.
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center gap-3">
                <TagIcon className="size-12 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t.taxonomy.noTagsFound || 'No tags created for this site yet.'}
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add keyword tags to enable quick filtering and cross-article topic clustering.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(true)}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] font-bold px-4 py-2 text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="size-4 stroke-[2.5]" />
                  <span>{t.taxonomy.newTag || 'Create Tag'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all duration-200 group shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/60">
                        <Hash className="size-3.5" />
                      </div>
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
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      disabled={isDeletingTag}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Delete tag"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Category Create/Edit Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Folder className="size-4 text-emerald-500" />
                  <span>
                    {editingCategory
                      ? t.taxonomy.editCategory || 'Edit Category'
                      : t.taxonomy.newCategory || 'New Category'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.name || 'Category Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      if (!editingCategory) setCategorySlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Extreme Flying"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.slug || 'URL Slug'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(slugify(e.target.value))}
                    placeholder="e.g. extreme-flying"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.parentCategory || 'Parent Category (Optional)'}
                  </label>
                  <select
                    value={categoryParentId}
                    onChange={(e) => setCategoryParentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {safeCategories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (/{c.slug})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.description || 'Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    placeholder="Editorial summary of content in this category..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.displayOrder || 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={categoryDisplayOrder}
                    onChange={(e) => setCategoryDisplayOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {t.actions.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCategory || isUpdatingCategory}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {(isCreatingCategory || isUpdatingCategory) && (
                      <Loader2 className="size-3.5 animate-spin text-[#072423]" />
                    )}
                    <span>
                      {editingCategory ? 'Update Category' : t.taxonomy.newCategory || 'Create Category'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 8. Tag Create Modal */}
        {isTagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TagIcon className="size-4 text-emerald-500" />
                  <span>{t.taxonomy.newTag || 'New Tag'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveTag} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.name || 'Tag Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={tagName}
                    onChange={(e) => {
                      setTagName(e.target.value);
                      setTagSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. High Altitude"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.slug || 'Tag Slug'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={tagSlug}
                    onChange={(e) => setTagSlug(slugify(e.target.value))}
                    placeholder="e.g. high-altitude"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.taxonomy.description || 'Description'}
                  </label>
                  <textarea
                    rows={2}
                    value={tagDescription}
                    onChange={(e) => setTagDescription(e.target.value)}
                    placeholder="Optional description of this tag..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-2xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    {t.actions.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTag}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00e599] to-[#05f292] text-[#072423] text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingTag && <Loader2 className="size-3.5 animate-spin text-[#072423]" />}
                    <span>{t.taxonomy.newTag || 'Create Tag'}</span>
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
