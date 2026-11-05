import type { PostItem, PostPublicationItem, SiteItem } from '@multi-site-cms/types';

import { primaryDomainUrl } from '@/features/sites/utils/site-url';

/** Most advanced first; mirrors `effectiveStatusSql` in the API. */
const STATUS_PRECEDENCE = ['published', 'scheduled', 'in_review', 'draft'];

function precedence(status: string): number {
  const index = STATUS_PRECEDENCE.indexOf(status);
  return index === -1 ? STATUS_PRECEDENCE.length : index;
}

/**
 * The publication shown for a post: the active site's, else the most advanced
 * one across sites. Uses the same rule as the API's status filter and counts,
 * so a row always matches the tab it is listed under.
 */
export function displayedPublication(
  post: PostItem,
  activeSiteId: string | null,
): PostPublicationItem | undefined {
  if (activeSiteId) return post.publications?.find((pub) => pub.siteId === activeSiteId);
  return post.publications?.reduce<PostPublicationItem | undefined>(
    (best, pub) => (!best || precedence(pub.status) < precedence(best.status) ? pub : best),
    undefined,
  );
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
  // Same rule as the site screens: only a verified, active primary domain.
  const origin = primaryDomainUrl(site.domains ?? []);
  return origin ? `${origin}/articles/${publication.slug}` : null;
}

/** Up to two initials from a display name, for the avatar circle. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 1);
  return letters.map((part) => part?.charAt(0).toUpperCase() ?? '').join('') || '?';
}
