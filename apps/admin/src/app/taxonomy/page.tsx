'use client';

import React, { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/feedback';
import { ShellLayout } from '@/components/shell';
import { apiErrorMessage } from '@/lib/api-error';
import { useAdmin } from '@/lib/admin-context';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '@/lib/cms-api';
import type { CategoryItem, TagItem } from '@multi-site-cms/types';
import {
  TaxonomyHeader,
  TaxonomyMetricsCards,
  TaxonomyTabs,
  CategoryHierarchyTree,
  TagListCard,
  CategoryModal,
  TagModal,
  type TaxonomyTab,
  type TaxonomyActionMessage,
} from '@/features/taxonomy';

function TaxonomyWorkspace() {
  const { t, activeSiteId, activeSite, availableSites, setActiveSiteId } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State
  const tabParam = searchParams.get('tab') === 'tags' ? 'tags' : 'categories';
  const [internalTab, setInternalTab] = useState<TaxonomyTab | null>(null);
  const activeTab: TaxonomyTab = internalTab ?? tabParam;

  const handleTabChange = (tab: TaxonomyTab) => {
    setInternalTab(tab);
    router.replace(`/taxonomy${tab === 'tags' ? '?tab=tags' : ''}`);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<TaxonomyActionMessage | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    kind: 'category' | 'tag';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [initialParentId, setInitialParentId] = useState<string | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);

  const effectiveSiteId = activeSiteId || availableSites[0]?.id || null;

  // Queries
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = useListCategoriesQuery(effectiveSiteId || '', { skip: !effectiveSiteId });

  const {
    data: tags = [],
    isLoading: isLoadingTags,
    isFetching: isFetchingTags,
    refetch: refetchTags,
  } = useListTagsQuery(effectiveSiteId || '', { skip: !effectiveSiteId });

  // Mutations
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();
  const [updateTag, { isLoading: isUpdatingTag }] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  // Filtered lists
  const safeCategories = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const safeTags = useMemo(() => (Array.isArray(tags) ? tags : []), [tags]);

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

  const hierarchyDepth = useMemo(() => {
    return safeCategories.some((c) => Boolean(c.parentId)) ? '2 Levels' : 'Flat';
  }, [safeCategories]);

  // Handlers
  const handleSaveCategory = async (payload: {
    name: string;
    slug: string;
    description?: string;
    parentId?: string | null;
    displayOrder: number;
  }) => {
    if (!effectiveSiteId) return;
    if (editingCategory) {
      await updateCategory({
        siteId: effectiveSiteId,
        categoryId: editingCategory.id,
        data: payload,
      }).unwrap();
      setActionMessage({
        type: 'success',
        text: `Category "${payload.name}" updated successfully.`,
      });
    } else {
      await createCategory({
        siteId: effectiveSiteId,
        data: payload,
      }).unwrap();
      setActionMessage({
        type: 'success',
        text: `Category "${payload.name}" created successfully.`,
      });
    }
    refetchCategories();
  };

  const handleDeleteCategory = (cat: CategoryItem) =>
    setPendingDelete({ kind: 'category', id: cat.id, name: cat.name });

  const handleSaveTag = async (payload: { name: string; slug: string; description?: string }) => {
    if (!effectiveSiteId) return;
    if (editingTag) {
      await updateTag({
        siteId: effectiveSiteId,
        tagId: editingTag.id,
        data: payload,
      }).unwrap();
      setActionMessage({ type: 'success', text: `Tag "${payload.name}" updated successfully.` });
    } else {
      await createTag({
        siteId: effectiveSiteId,
        data: payload,
      }).unwrap();
      setActionMessage({ type: 'success', text: `Tag "${payload.name}" created successfully.` });
    }
    refetchTags();
  };

  const handleDeleteTag = (tag: TagItem) =>
    setPendingDelete({ kind: 'tag', id: tag.id, name: tag.name });

  /** Confirmed in the dialog (replaces native confirm()). */
  const confirmDelete = async () => {
    if (!pendingDelete || !effectiveSiteId) return;
    const { kind, id, name } = pendingDelete;
    setIsDeleting(true);
    try {
      if (kind === 'category') {
        await deleteCategory({ siteId: effectiveSiteId, categoryId: id }).unwrap();
        refetchCategories();
      } else {
        await deleteTag({ siteId: effectiveSiteId, tagId: id }).unwrap();
        refetchTags();
      }
      setActionMessage({
        type: 'success',
        text: `${kind === 'category' ? 'Category' : 'Tag'} "${name}" deleted.`,
      });
    } catch (err: unknown) {
      setActionMessage({
        type: 'error',
        text: apiErrorMessage(err, `Failed to delete "${name}".`),
      });
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  const currentSiteName =
    activeSite?.name || availableSites.find((s) => s.id === effectiveSiteId)?.name || 'Select Site';

  const isLoading = isLoadingCategories || isLoadingTags;
  const isFetching = isFetchingCategories || isFetchingTags;

  return (
    <ShellLayout>
      <div className="w-full space-y-6 pb-16">
        {/* Action feedback message */}
        {actionMessage && (
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <AlertCircle className="size-4 shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* 1. Header & Controls */}
        <TaxonomyHeader
          title={t.taxonomy.title || 'Site Taxonomy Management'}
          subtitle={
            t.taxonomy.subtitle ||
            'Hierarchical categories and classification tags scoped to this site.'
          }
          currentSiteName={currentSiteName}
          availableSites={availableSites}
          effectiveSiteId={effectiveSiteId}
          onSiteChange={(sId) => setActiveSiteId(sId)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          activeTab={activeTab}
          isFetching={isFetching}
          onRefresh={() => {
            refetchCategories();
            refetchTags();
          }}
          onOpenCreate={() => {
            if (activeTab === 'categories') {
              setEditingCategory(null);
              setInitialParentId(null);
              setIsCategoryModalOpen(true);
            } else {
              setEditingTag(null);
              setIsTagModalOpen(true);
            }
          }}
        />

        {/* 2. Top Metric Cards */}
        <TaxonomyMetricsCards
          categoriesCount={safeCategories.length}
          tagsCount={safeTags.length}
          hierarchyDepth={hierarchyDepth}
          siteName={currentSiteName}
        />

        {/* 3. Tabs */}
        <TaxonomyTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categoriesCount={safeCategories.length}
          tagsCount={safeTags.length}
        />

        {/* 4. Tab Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <Loader2 className="size-6 animate-spin text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Loading taxonomy...
            </p>
          </div>
        ) : activeTab === 'categories' ? (
          <CategoryHierarchyTree
            categories={filteredCategories}
            onEdit={(cat) => {
              setEditingCategory(cat);
              setInitialParentId(cat.parentId || null);
              setIsCategoryModalOpen(true);
            }}
            onDelete={handleDeleteCategory}
            onAddSubcategory={(parentCat) => {
              setEditingCategory(null);
              setInitialParentId(parentCat.id);
              setIsCategoryModalOpen(true);
            }}
          />
        ) : (
          <TagListCard
            tags={filteredTags}
            onEdit={(tag) => {
              setEditingTag(tag);
              setIsTagModalOpen(true);
            }}
            onDelete={handleDeleteTag}
          />
        )}
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setInitialParentId(null);
        }}
        editingCategory={editingCategory}
        initialParentId={initialParentId}
        availableCategories={safeCategories}
        onSave={handleSaveCategory}
        isSaving={isCreatingCategory || isUpdatingCategory}
      />

      {/* Tag Modal */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setEditingTag(null);
        }}
        editingTag={editingTag}
        onSave={handleSaveTag}
        isSaving={isCreatingTag || isUpdatingTag}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.kind === 'category' ? 'Delete this category?' : 'Delete this tag?'}
        description={
          pendingDelete?.kind === 'category'
            ? `"${pendingDelete.name}" is removed from this site. A category that has subcategories or is used by posts cannot be deleted.`
            : `"${pendingDelete?.name ?? ''}" is removed from this site. A tag that is used by posts cannot be deleted.`
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        isBusy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </ShellLayout>
  );
}

/**
 * `useSearchParams` opts the page into client rendering; Next.js requires a
 * Suspense boundary around it or the production build fails to prerender.
 */
export default function TaxonomyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading taxonomy</span>
        </div>
      }
    >
      <TaxonomyWorkspace />
    </Suspense>
  );
}
