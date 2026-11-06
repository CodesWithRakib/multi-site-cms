'use client';

import React, { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { MediaAssetItem, PostItem, PostPublicationItem } from '@multi-site-cms/types';
import { RichTextEditor } from '@/features/editor';
import { MediaLibraryModal } from '@/features/media';
import {
  useGetEffectivePolicyQuery,
  useGetMediaAssetQuery,
  useListSitesQuery,
  useUpdatePostMutation,
} from '@/lib/cms-api';
import { useAutosave } from '../hooks/useAutosave';
import { useDraftRecovery } from '../hooks/useDraftRecovery';
import { usePostSubmit } from '../hooks/usePostSubmit';
import { PostBasicFields } from './PostBasicFields';
import { PostFeaturedImagePicker } from './PostFeaturedImagePicker';
import { PostFormHeader } from './PostFormHeader';
import { PostPreviewModal } from './PostPreviewModal';
import { PostPublicationsSection } from './PostPublicationsSection';
import { PostDraftRecoveryBanner } from './PostDraftRecoveryBanner';
import type { SitePubConfig } from './PostSitePublicationCard';
import { PublishingModal, type PublishingActionType } from './PublishingModal';

export interface PostFormProps {
  initialPost?: PostItem;
  isCreateMode?: boolean;
}

export function PostForm({ initialPost, isCreateMode = false }: PostFormProps) {
  // Basic post fields
  const [title, setTitle] = useState(initialPost?.currentRevision?.title || '');
  const [excerpt, setExcerpt] = useState(initialPost?.currentRevision?.excerpt || '');
  const [type, setType] = useState<string>(initialPost?.type || 'article');
  const [sourceLocale, setSourceLocale] = useState(initialPost?.sourceLocale || 'en');
  const [isLocalDirty, setIsLocalDirty] = useState(false);

  // Rich text body
  const [bodyJson, setBodyJson] = useState<Record<string, unknown>>(
    initialPost?.currentRevision?.body || { type: 'doc', content: [] },
  );
  const [bodyHtml, setBodyHtml] = useState<string>('');

  // Featured image: `undefined` = untouched, so show the one already on the
  // post's publications; a picked asset or `null` (removed) overrides it.
  const [pickedImage, setPickedImage] = useState<MediaAssetItem | null | undefined>(undefined);
  const existingImageId =
    initialPost?.publications?.find((p) => p.featuredImageId)?.featuredImageId ?? null;
  const { data: existingImage } = useGetMediaAssetQuery(existingImageId ?? '', {
    skip: !existingImageId || pickedImage !== undefined,
  });
  const featuredImage = pickedImage === undefined ? (existingImage ?? null) : pickedImage;
  const featuredImageChanged = pickedImage !== undefined;
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

  const [updatePost] = useUpdatePostMutation();
  const { data: sitesData = [] } = useListSitesQuery();
  const { data: policy } = useGetEffectivePolicyQuery();
  const currentRevisionNumber = initialPost?.currentRevisionNumber || 1;

  // Autosave handler for existing posts
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
    // Settings → Publishing → autosave interval (enforced as the longest unsaved stretch).
    maxWaitMs: (policy?.autoSaveIntervalSeconds ?? 30) * 1000,
    enabled: !isCreateMode,
  });

  // Draft recovery from sessionStorage (active in both create & edit modes)
  const { recoverableDraft, hasRecoverableDraft, clearDraft } = useDraftRecovery(
    initialPost?.id || 'new_post',
    { title, excerpt, type, bodyJson },
    isLocalDirty || autosaveStatus !== 'saved',
  );

  const handleRestoreDraft = () => {
    if (!recoverableDraft) return;
    setTitle(recoverableDraft.data.title || '');
    setExcerpt(recoverableDraft.data.excerpt || '');
    setType(recoverableDraft.data.type || 'article');
    setBodyJson(recoverableDraft.data.bodyJson);
    if (editorRef.current && recoverableDraft.data.bodyJson) {
      editorRef.current.commands.setContent(recoverableDraft.data.bodyJson);
    }
    clearDraft();
  };

  // Submit hook
  const { handleFormSubmit, isSubmitting } = usePostSubmit({
    isCreateMode,
    initialPost,
    title,
    excerpt,
    type,
    sourceLocale,
    bodyJson,
    featuredImage,
    featuredImageChanged,
    siteConfigs,
    sitesData,
    clearDraft,
    triggerManualSave,
  });

  const handleEditorChange = (json: Record<string, unknown>, html: string) => {
    setBodyJson(json);
    setBodyHtml(html);
    setIsLocalDirty(true);
    markDirty();
  };

  const handleMediaSelect = (asset: MediaAssetItem) => {
    if (mediaTarget === 'featured') {
      setPickedImage(asset);
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
        .setImage({ src: url, alt: asset.altText || asset.originalFilename || '' })
        .run();
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 w-full pb-16">
        <PostFormHeader
          isCreateMode={isCreateMode}
          currentRevisionNumber={currentRevisionNumber}
          lastSavedAt={lastSavedAt}
          autosaveStatus={autosaveStatus}
          isSubmitting={isSubmitting}
          onOpenPreview={() => setIsPreviewOpen(true)}
          hasInitialPost={Boolean(initialPost?.id)}
          onSaveShortcut={() => void triggerManualSave()}
        />

        {hasRecoverableDraft && recoverableDraft && (
          <PostDraftRecoveryBanner
            savedAt={recoverableDraft.savedAt}
            onRestore={handleRestoreDraft}
            onDismiss={clearDraft}
          />
        )}

        <PostBasicFields
          title={title}
          onTitleChange={(val) => {
            setTitle(val);
            setIsLocalDirty(true);
            markDirty();
          }}
          excerpt={excerpt}
          onExcerptChange={(val) => {
            setExcerpt(val);
            setIsLocalDirty(true);
            markDirty();
          }}
          type={type}
          onTypeChange={(val) => {
            setType(val);
            setIsLocalDirty(true);
            markDirty();
          }}
          sourceLocale={sourceLocale}
          onLocaleChange={(val) => {
            setSourceLocale(val);
            setIsLocalDirty(true);
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
            setPickedImage(null);
            markDirty();
          }}
        />

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Editorial Content Body
          </label>
          <RichTextEditor
            initialContent={bodyJson}
            contentType={type}
            placeholder="Compose rich article content. Use toolbar for headings, lists, tables, images, destination guides, or timeline events..."
            onChange={handleEditorChange}
            onOpenMediaLibrary={() => {
              setMediaTarget('editor');
              setIsMediaLibraryOpen(true);
            }}
            editorRef={editorRef}
          />
        </div>

        <PostPublicationsSection
          sites={sitesData}
          title={title}
          siteConfigs={siteConfigs}
          existingPublications={initialPost?.publications}
          latestRevisionId={initialPost?.currentRevision?.id}
          onConfigChange={(sId, updated) => {
            setSiteConfigs((prev) => ({ ...prev, [sId]: updated }));
            markDirty();
          }}
          onOpenPublishModal={(pub, action) => setPublishingTarget({ publication: pub, action })}
        />
      </form>

      {/* Dialogs live outside the post <form>: PublishingModal has its own
          <form>, and nested forms break submission (and its submit event
          would also bubble into the post save handler). */}
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
    </>
  );
}
