'use client';

import { useRouter } from 'next/navigation';
import type { MediaAssetItem, PostItem, SiteItem } from '@multi-site-cms/types';
import { useCreatePostMutation, useCreatePublicationMutation } from '@/lib/cms-api';
import type { SitePubConfig } from '../components/PostSitePublicationCard';

export interface UsePostSubmitProps {
  isCreateMode: boolean;
  initialPost?: PostItem;
  title: string;
  excerpt: string;
  type: string;
  sourceLocale: string;
  bodyJson: Record<string, unknown>;
  featuredImage: MediaAssetItem | null;
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
  siteConfigs,
  sitesData,
  clearDraft,
  triggerManualSave,
}: UsePostSubmitProps) {
  const router = useRouter();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const [createPublication] = useCreatePublicationMutation();

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
            // Ignored
          }
        }
      }
    }
  };

  return {
    handleFormSubmit,
    isSubmitting: isCreating,
  };
}
