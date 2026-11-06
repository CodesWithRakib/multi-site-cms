'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { MediaAssetItem, PostItem, SiteItem } from '@multi-site-cms/types';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreatePostMutation,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
} from '@/lib/cms-api';
import type { SitePubConfig } from '../components/PostSitePublicationCard';
import { publicationChanges } from '../utils/publication-changes';
import { slugifyTitle } from '../utils/slugify';

export interface UsePostSubmitProps {
  isCreateMode: boolean;
  initialPost?: PostItem;
  title: string;
  excerpt: string;
  type: string;
  sourceLocale: string;
  bodyJson: Record<string, unknown>;
  featuredImage: MediaAssetItem | null;
  /** True when the editor picked or removed the featured image in this session. */
  featuredImageChanged: boolean;
  siteConfigs: Record<string, SitePubConfig>;
  sitesData: SiteItem[];
  clearDraft: () => void;
  triggerManualSave: () => Promise<void>;
}

export function usePostSubmit({
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
}: UsePostSubmitProps) {
  const router = useRouter();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [createPublication] = useCreatePublicationMutation();
  const [updatePublication] = useUpdatePublicationMutation();
  const [isSaving, setIsSaving] = useState(false);

  const createNewPost = async () => {
    const publications = sitesData
      .map((site) => ({ site, config: siteConfigs[site.id] }))
      .filter(({ config }) => config?.enabled)
      .map(({ site, config }) => ({
        siteId: site.id,
        slug: config?.slug || slugifyTitle(title),
        status: config?.status,
        scheduledFor: config?.scheduledFor,
        categoryIds: config?.categoryIds.length ? config.categoryIds : undefined,
        seoTitle: config?.seoTitle || undefined,
        seoDescription: config?.seoDescription || undefined,
        featuredImageId: featuredImage?.id,
      }));

    try {
      const created = await createPost({
        title: title.trim(),
        excerpt: excerpt.trim() || undefined,
        type,
        sourceLocale,
        body: bodyJson,
        publications: publications.length > 0 ? publications : undefined,
      }).unwrap();
      clearDraft();
      router.push(`/posts/${created.id}/edit`);
    } catch (error: unknown) {
      alert(`Failed to create post: ${apiErrorMessage(error, 'Server error')}`);
    }
  };

  const saveExistingPost = async (postId: string) => {
    await triggerManualSave();

    const failures: string[] = [];
    for (const site of sitesData) {
      const config = siteConfigs[site.id];
      const existingPub = initialPost?.publications?.find((p) => p.siteId === site.id);
      try {
        if (!existingPub && config?.enabled) {
          await createPublication({
            postId,
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
        } else if (existingPub) {
          const data = publicationChanges(config, {
            changed: featuredImageChanged,
            id: featuredImage?.id ?? null,
          });
          if (data) {
            await updatePublication({
              siteId: site.id,
              publicationId: existingPub.id,
              data,
            }).unwrap();
          }
        }
      } catch (error: unknown) {
        failures.push(`${site.name}: ${apiErrorMessage(error, 'could not be saved')}`);
      }
    }

    if (failures.length > 0) {
      alert(`Some site settings were not saved:\n${failures.join('\n')}`);
    }
  };

  const handleFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      alert('Post title is required.');
      return;
    }

    if (isCreateMode) {
      await createNewPost();
      return;
    }
    if (!initialPost?.id) return;

    setIsSaving(true);
    try {
      await saveExistingPost(initialPost.id);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleFormSubmit,
    isSubmitting: isCreating || isSaving,
  };
}
