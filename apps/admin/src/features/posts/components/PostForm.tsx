'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Editor } from '@tiptap/react';
import type { MediaAssetItem, PostItem, PostPublicationItem } from '@multi-site-cms/types';
import { RichTextEditor } from '@/features/editor';
import { MediaLibraryModal } from '@/features/media';
import {
  useCreatePostMutation,
  useCreatePublicationMutation,
  useListSitesQuery,
  useUpdatePostMutation,
} from '@/lib/cms-api';
import { useAutosave } from '../hooks/useAutosave';
import { useDraftRecovery } from '../hooks/useDraftRecovery';
import { PostBasicFields } from './PostBasicFields';
import { PostFeaturedImagePicker } from './PostFeaturedImagePicker';
import { PostFormHeader } from './PostFormHeader';
import { PostPreviewModal } from './PostPreviewModal';
import { PostSitePublicationCard, type SitePubConfig } from './PostSitePublicationCard';
import { PublishingModal, type PublishingActionType } from './PublishingModal';

export interface PostFormProps {
  initialPost?: PostItem;
  isCreateMode?: boolean;
}

export function PostForm({ initialPost, isCreateMode = false }: PostFormProps) {
  const router = useRouter();

  // Basic post fields
  const [title, setTitle] = useState(initialPost?.currentRevision?.title || '');
  const [excerpt, setExcerpt] = useState(initialPost?.currentRevision?.excerpt || '');
  const [type, setType] = useState<string>(initialPost?.type || 'article');
  const [sourceLocale, setSourceLocale] = useState(initialPost?.sourceLocale || 'en');

  // Rich text body
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>(
    initialPost?.currentRevision?.body || { type: 'doc', content: [] },
  );
  const [bodyHtml, setBodyHtml] = useState<string>('');

  // Featured Image
  const [featuredImage, setFeaturedImage] = useState<MediaAssetItem | null>(null);

  // Publications state: map of siteId -> SitePubConfig
  const [siteConfigs, setSiteConfigs] = useState<Record<string, SitePubConfig>>({});

  // Modals & targets
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'featured' | 'editor'>('featured');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [publishingTarget, setPublishingTarget] = useState<{
    publication: PostPublicationItem;
    action: PublishingActionType;
  } | null>(null);

  const editorRef = useRef<Editor | null>(null);

  // API mutations & queries
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();
  const [createPublication] = useCreatePublicationMutation();
  const { data: sitesData = [] } = useListSitesQuery();

  const currentRevisionNumber = initialPost?.currentRevisionNumber || 1;

  // Autosave handler for edit mode
  const handleAutosave = async (formData: {
    title: string;
    excerpt: string;
    type: string;
    bodyJson: Record<string, unknown>;
  }) => {
    if (isCreateMode || !initialPost?.id) return;
    if (!formData.title.trim()) return;

    await updatePost({
      postId: initialPost.id,
      data: {
        expectedRevisionNumber: currentRevisionNumber,
        title: formData.title,
        excerpt: formData.excerpt,
        type: formData.type,
        body: formData.bodyJson,
      },
    }).unwrap();
  };

  const {
    status: autosaveStatus,
    lastSavedAt,
    markDirty,
    triggerManualSave,
  } = useAutosave({
    data: { title, excerpt, type, bodyJson },
    onSave: handleAutosave,
    debounceMs: 2500,
    enabled: !isCreateMode,
  });

  // Draft recovery from sessionStorage
  const { clearDraft } = useDraftRecovery(
    initialPost?.id || 'new_post',
    { title, excerpt, type, bodyJson },
    autosaveStatus !== 'saved',
  );

  const handleEditorChange = (json: Record<string, unknown>, html: string) => {
    setBodyJson(json);
    setBodyHtml(html);
    markDirty();
  };

  const handleMediaSelect = (asset: MediaAssetItem) => {
    if (mediaTarget === 'featured') {
      setFeaturedImage(asset);
      markDirty();
    } else if (mediaTarget === 'editor' && editorRef.current) {
      const url =
        asset.url ||
        (asset.storageKey.startsWith('http')
          ? asset.storageKey
          : `/api/v1/media/assets/${asset.storageKey}`);
      editorRef.current
        .chain()
        .focus()
        .setImage({ src: url, alt: asset.altText || '' })
        .run();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Post title is required.');
      return;
    }

    if (isCreateMode) {
      try {
        const publicationsPayload = [];
        for (const site of sitesData) {
          const defaultSlug = (title || 'post-slug')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const existingPub = initialPost?.publications?.find((p) => p.siteId === site.id);
          const config = siteConfigs[site.id] || {
            enabled: Boolean(existingPub),
            slug: existingPub?.slug || defaultSlug,
            status: 'draft' as const,
            categoryIds: [],
            seoTitle: existingPub?.seoTitle || '',
            seoDescription: existingPub?.seoDescription || '',
          };

          if (config.enabled) {
            publicationsPayload.push({
              siteId: site.id,
              slug: config.slug,
              status: config.status,
              scheduledFor: config.scheduledFor,
              categoryIds: config.categoryIds.length > 0 ? config.categoryIds : undefined,
              seoTitle: config.seoTitle || undefined,
              seoDescription: config.seoDescription || undefined,
              featuredImageId: featuredImage?.id,
            });
          }
        }

        const created = await createPost({
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          type,
          sourceLocale,
          body: bodyJson,
          publications: publicationsPayload.length > 0 ? publicationsPayload : undefined,
        }).unwrap();

        clearDraft();
        router.push(`/posts/${created.id}/edit`);
      } catch (err: unknown) {
        alert('Failed to create post: ' + ((err as Error).message || 'Server error'));
      }
    } else {
      await triggerManualSave();

      // For existing post, update publication targets if toggled on
      for (const site of sitesData) {
        const config = siteConfigs[site.id];
        const existingPub = initialPost?.publications?.find((p) => p.siteId === site.id);
        if (config?.enabled && !existingPub && initialPost?.id) {
          try {
            await createPublication({
              postId: initialPost.id,
              data: {
                siteId: site.id,
                slug: config.slug,
                status: config.status,
                categoryIds: config.categoryIds.length > 0 ? config.categoryIds : undefined,
                seoTitle: config.seoTitle || undefined,
                seoDescription: config.seoDescription || undefined,
                featuredImageId: featuredImage?.id,
              },
            }).unwrap();
          } catch {
            // Publication might already exist or conflict
          }
        }
      }
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 w-full pb-16">
      <PostFormHeader
        isCreateMode={isCreateMode}
        currentRevisionNumber={currentRevisionNumber}
        lastSavedAt={lastSavedAt}
        autosaveStatus={autosaveStatus}
        isSubmitting={isCreating}
        onOpenPreview={() => setIsPreviewOpen(true)}
        hasInitialPost={Boolean(initialPost?.id)}
      />

      <PostBasicFields
        title={title}
        onTitleChange={(val) => {
          setTitle(val);
          markDirty();
        }}
        excerpt={excerpt}
        onExcerptChange={(val) => {
          setExcerpt(val);
          markDirty();
        }}
        type={type}
        onTypeChange={(val) => {
          setType(val);
          markDirty();
        }}
        sourceLocale={sourceLocale}
        onLocaleChange={(val) => {
          setSourceLocale(val);
          markDirty();
        }}
      />

      <PostFeaturedImagePicker
        featuredImage={featuredImage}
        onSelectClick={() => {
          setMediaTarget('featured');
          setIsMediaLibraryOpen(true);
        }}
        onRemove={() => {
          setFeaturedImage(null);
          markDirty();
        }}
      />

      {/* Tiptap Rich Text Editor */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Editorial Content Body
        </label>
        <RichTextEditor
          initialContent={bodyJson}
          contentType={type}
          placeholder="Compose rich article content. Use '/' for blocks, lists, destination guides, or timeline events..."
          onChange={handleEditorChange}
          onOpenMediaLibrary={() => {
            setMediaTarget('editor');
            setIsMediaLibraryOpen(true);
          }}
          editorRef={editorRef}
        />
      </div>

      {/* Multi-Site Publications Section */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-sans">
            Site Publications
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish this canonical post across independent websites with site-specific slugs,
            categories, and SEO configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sitesData.map((site) => {
            const defaultSlug = (title || 'post-slug')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            const existingPub = initialPost?.publications?.find((p) => p.siteId === site.id);
            const currentConfig = siteConfigs[site.id] || {
              enabled: Boolean(existingPub),
              slug: existingPub?.slug || defaultSlug,
              status: existingPub?.status || 'draft',
              categoryIds: [],
              seoTitle: existingPub?.seoTitle || '',
              seoDescription: existingPub?.seoDescription || '',
            };

            return (
              <PostSitePublicationCard
                key={site.id}
                site={site}
                config={currentConfig}
                existingPub={existingPub}
                onChange={(updated) => {
                  setSiteConfigs((prev) => ({ ...prev, [site.id]: updated }));
                  markDirty();
                }}
                onOpenPublishModal={(pub, action) =>
                  setPublishingTarget({ publication: pub, action })
                }
              />
            );
          })}
        </div>
      </div>

      <MediaLibraryModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelectMedia={handleMediaSelect}
      />

      {!isCreateMode && initialPost?.id && (
        <PostPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          postId={initialPost.id}
          fallbackTitle={title}
          fallbackBodyHtml={bodyHtml}
        />
      )}

      {publishingTarget && (
        <PublishingModal
          isOpen={Boolean(publishingTarget)}
          onClose={() => setPublishingTarget(null)}
          action={publishingTarget.action}
          publication={publishingTarget.publication}
          postTitle={title}
        />
      )}
    </form>
  );
}
