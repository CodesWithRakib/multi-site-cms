import type { PostItem, PostPublicationItem, SiteItem } from '@multi-site-cms/types';

/** The publication shown for a post: the active site's, else the first one. */
export function displayedPublication(
  post: PostItem,
  activeSiteId: string | null,
): PostPublicationItem | undefined {
  return activeSiteId
    ? post.publications?.find((pub) => pub.siteId === activeSiteId)
    : post.publications?.[0];
}

/** Publication status when a publication exists, else the canonical post status. */
export function effectiveStatus(
  post: PostItem,
  publication: PostPublicationItem | undefined,
): string {
  return publication?.status || post.status;
}

export type PostKind = 'air' | 'travel' | 'other';

export function postKind(type: string): PostKind {
  const normalized = type.toLowerCase();
  if (normalized.includes('air')) return 'air';
  if (normalized.includes('travel') || normalized.includes('guide')) return 'travel';
  return 'other';
}

/**
 * Public URL of a publication on its site. Both sites serve articles at
 * /articles/[slug]. Returns null rather than inventing a domain when the site
 * has none configured.
 */
export function publicationLiveUrl(
  site: SiteItem | undefined,
  publication: PostPublicationItem | undefined,
): string | null {
  if (!site || !publication?.slug) return null;
  const hostname =
    site.domains?.find((domain) => domain.isPrimary)?.hostname ?? site.domains?.[0]?.hostname;
  return hostname ? `https://${hostname}/articles/${publication.slug}` : null;
}

/** Up to two initials from a display name, for the avatar circle. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 1);
  return letters.map((part) => part?.charAt(0).toUpperCase() ?? '').join('') || '?';
}
