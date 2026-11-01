/**
 * Domain vocabularies for the persistence layer.
 *
 * PostgreSQL native enums are intentionally not used: adding or removing a value
 * would require an `ALTER TYPE` migration that cannot run inside a transaction in
 * every supported PostgreSQL version. These unions are paired with `CHECK`
 * constraints in the migrations, which are equally strict and far cheaper to
 * evolve. Keep the two in sync whenever a value changes.
 */

export const USER_STATUSES = ['active', 'invited', 'suspended', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const ROLE_SCOPES = ['platform', 'site'] as const;
export type RoleScope = (typeof ROLE_SCOPES)[number];

export const SITE_STATUSES = ['active', 'paused', 'archived'] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];

export const DOMAIN_STATUSES = ['active', 'disabled'] as const;
export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const POST_TYPES = ['article', 'guide', 'news', 'live_update'] as const;
export type PostType = (typeof POST_TYPES)[number];

/** Editorial state of the canonical content item, independent of any site. */
export const POST_STATUSES = ['draft', 'in_review', 'approved', 'archived'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/** Per-site publication state. Distinct from `POST_STATUSES` on purpose. */
export const PUBLICATION_STATUSES = ['draft', 'scheduled', 'published', 'archived'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const MEDIA_STATUSES = ['active', 'archived'] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_USAGE_ROLES = ['featured', 'gallery', 'inline', 'attachment'] as const;
export type MediaUsageRole = (typeof MEDIA_USAGE_ROLES)[number];

export const EVENT_STATUSES = ['scheduled', 'live', 'completed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const ACTOR_TYPES = ['user', 'system', 'bootstrap'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];
