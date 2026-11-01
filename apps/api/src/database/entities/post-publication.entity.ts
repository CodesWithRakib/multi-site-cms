import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Event } from './event.entity';
import { MediaAsset } from './media-asset.entity';
import { Post } from './post.entity';
import { Site } from './site.entity';
import type { PublicationStatus } from './types';

/**
 * A site's publication of a canonical post. This is the tenant-visible unit and
 * the only row a public request may read content through.
 *
 * Isolation and integrity:
 * - `site_id` is required, and every unique constraint is prefixed by it.
 * - `(post_id, revision_id) → post_revisions(post_id, id)` proves the pinned
 *   revision belongs to this post.
 * - `(event_id, site_id)` and `(featured_image_id, site_id)` prove the referenced
 *   rows belong to the same site, so a publication cannot leak another tenant's
 *   media or event. Platform-scoped media (`site_id IS NULL`) is therefore not
 *   usable as a featured image; that is intentional and documented.
 *
 * `scheduled_for` is the requested instant; `published_at` is the actual instant.
 * They are separate columns because "scheduled for 09:00, published 09:04" must be
 * observable, and because a worker must be able to detect due work without
 * conflating it with publication.
 */
@Entity({ name: 'post_publications' })
@Check(
  'CHK_post_publications_status',
  "\"status\" IN ('draft', 'scheduled', 'published', 'archived')",
)
@Check('CHK_post_publications_slug_format', '"slug"::text ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\'')
@Check('CHK_post_publications_slug_length', 'char_length("slug"::text) BETWEEN 1 AND 96')
@Check('CHK_post_publications_schedule', '"status" <> \'scheduled\' OR "scheduled_for" IS NOT NULL')
@Check('CHK_post_publications_published', '"status" <> \'published\' OR "published_at" IS NOT NULL')
@Check(
  'CHK_post_publications_canonical_url',
  '"canonical_url" IS NULL OR "canonical_url" ~ \'^https?://[^\\s]+$\'',
)
@Check(
  'CHK_post_publications_template_key',
  '"template_key" IS NULL OR "template_key" ~ \'^[a-z][a-z0-9-]{0,63}$\'',
)
@Check(
  'CHK_post_publications_seo_title_length',
  '"seo_title" IS NULL OR char_length("seo_title") <= 200',
)
@Check(
  'CHK_post_publications_seo_description_length',
  '"seo_description" IS NULL OR char_length("seo_description") <= 320',
)
@Index('IDX_post_publications_site_status_published', ['siteId', 'status', 'publishedAt'])
@Index('IDX_post_publications_due', ['scheduledFor'])
@Index('IDX_post_publications_event', ['eventId', 'publishedAt'])
export class PostPublication {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @Column({ name: 'revision_id', type: 'uuid' })
  revisionId!: string;

  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  eventId!: string | null;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text', default: 'draft' })
  status!: PublicationStatus;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor!: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'seo_title', type: 'text', nullable: true })
  seoTitle!: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription!: string | null;

  @Column({ name: 'canonical_url', type: 'text', nullable: true })
  canonicalUrl!: string | null;

  @Column({ name: 'featured_image_id', type: 'uuid', nullable: true })
  featuredImageId!: string | null;

  @Column({ name: 'template_key', type: 'text', nullable: true })
  templateKey!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Site, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'site_id' })
  site!: Site;

  @ManyToOne(() => Post, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => Event, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'event_id' })
  event!: Event | null;

  @ManyToOne(() => MediaAsset, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'featured_image_id' })
  featuredImage!: MediaAsset | null;
}
