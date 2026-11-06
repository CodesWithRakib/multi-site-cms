import type { UpdatePublicationPayload } from '@/lib/cms-api';

import type { SitePubConfig } from '../components/PostSitePublicationCard';

/**
 * PATCH body for an existing publication from what the editor changed: the
 * site card (slug, categories, event, SEO) and/or the post's featured image.
 * `featuredImageId` is only sent when the image was picked or removed.
 * Returns null when nothing about this publication changed.
 */
export function publicationChanges(
  config: SitePubConfig | undefined,
  image: { changed: boolean; id: string | null },
): UpdatePublicationPayload | null {
  const data: UpdatePublicationPayload = {};
  if (config) {
    data.slug = config.slug;
    data.categoryIds = config.categoryIds;
    data.eventId = config.eventId || null;
    data.seoTitle = config.seoTitle.trim() || null;
    data.seoDescription = config.seoDescription.trim() || null;
  }
  if (image.changed) data.featuredImageId = image.id;
  return Object.keys(data).length > 0 ? data : null;
}
