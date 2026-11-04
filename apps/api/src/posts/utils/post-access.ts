import type { EffectiveAuthContext } from '../../auth/services/authorization.service';
import type { PostPublication } from '../../database/entities/post-publication.entity';
import type { Post } from '../../database/entities/post.entity';

type PublicationSites = ReadonlyArray<Pick<PostPublication, 'siteId'>>;

/**
 * Object-level read/write access to a canonical post: Super Admin, the author,
 * or an admin of at least one site the post is published on. Route-level
 * `post:*` permissions alone never grant access to a specific post (SEC-8).
 */
export function canAccessPost(
  actor: EffectiveAuthContext,
  post: Pick<Post, 'authorId'>,
  publications: PublicationSites,
): boolean {
  if (actor.isSuperAdmin) return true;
  if (post.authorId === actor.user.id) return true;
  return publications.some((pub) => actor.authorizedSiteIds.includes(pub.siteId));
}

/**
 * Operations that change every publication of a post (archive) need authority
 * over every site the post is published on, so one site's admin cannot take
 * content offline on another site (SEC-11).
 */
export function canManageAllPublications(
  actor: EffectiveAuthContext,
  publications: PublicationSites,
): boolean {
  if (actor.isSuperAdmin) return true;
  return publications.every((pub) => actor.authorizedSiteIds.includes(pub.siteId));
}
