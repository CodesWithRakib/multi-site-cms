import { AuditEvent } from './audit-event.entity';
import { AnalyticsPageView } from './analytics-page-view.entity';
import { PlatformSettingsEntity } from './platform-settings.entity';
import { NewsletterSubscriber } from './newsletter-subscriber.entity';
import { Category } from './category.entity';
import { Event } from './event.entity';
import { MediaAsset } from './media-asset.entity';
import { OutboxEvent } from './outbox-event.entity';
import { Permission } from './permission.entity';
import { Post } from './post.entity';
import { PostPublication } from './post-publication.entity';
import { PostPublicationCategory } from './post-publication-category.entity';
import { PostPublicationMedia } from './post-publication-media.entity';
import { PostPublicationTag } from './post-publication-tag.entity';
import { PostRevision } from './post-revision.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { Session } from './session.entity';
import { Site } from './site.entity';
import { SiteDomain } from './site-domain.entity';
import { Tag } from './tag.entity';
import { User } from './user.entity';
import { UserRoleAssignment } from './user-role-assignment.entity';

/**
 * Explicit entity registry shared by the runtime `DataSource` and the TypeORM CLI.
 *
 * Listing is deliberate rather than glob-based: a glob silently picks up a stray
 * file in a build output directory, and it cannot resolve under every bundler.
 */
export const ENTITIES = [
  // Identity and authorization
  User,
  Session,
  Role,
  Permission,
  RolePermission,
  UserRoleAssignment,
  // Site registry and site-owned configuration
  Site,
  SiteDomain,
  NewsletterSubscriber,
  Category,
  Tag,
  Event,
  // Canonical content and publication
  Post,
  PostRevision,
  PostPublication,
  PostPublicationCategory,
  PostPublicationTag,
  // Media
  MediaAsset,
  PostPublicationMedia,
  // Audit and Outbox
  AuditEvent,
  OutboxEvent,
  // Analytics
  AnalyticsPageView,
  // Platform Settings
  PlatformSettingsEntity,
] as const;

export {
  AnalyticsPageView,
  AuditEvent,
  Category,
  Event,
  MediaAsset,
  NewsletterSubscriber,
  OutboxEvent,
  Permission,
  PlatformSettingsEntity,
  Post,
  PostPublication,
  PostPublicationCategory,
  PostPublicationMedia,
  PostPublicationTag,
  PostRevision,
  Role,
  RolePermission,
  Session,
  Site,
  SiteDomain,
  Tag,
  User,
  UserRoleAssignment,
};
