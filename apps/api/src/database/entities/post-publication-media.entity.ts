import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { MediaAsset } from './media-asset.entity';
import { PostPublication } from './post-publication.entity';
import type { MediaUsageRole } from './types';

/**
 * Records how a publication uses an asset (featured, gallery, inline, attachment)
 * and in what order. This is the "where is this asset used" relation that makes
 * deletion safe: an asset referenced here cannot be hard-deleted.
 *
 * `site_id` participates in both composite foreign keys, so a publication can
 * only reference media owned by the same site.
 */
@Entity({ name: 'post_publication_media' })
@Check(
  'CHK_post_publication_media_role',
  "\"role\" IN ('featured', 'gallery', 'inline', 'attachment')",
)
@Check('CHK_post_publication_media_position', '"position" >= 0')
@Index('IDX_post_publication_media_asset', ['mediaId', 'siteId'])
@Index('IDX_post_publication_media_publication', ['publicationId', 'position'])
export class PostPublicationMedia {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'publication_id', type: 'uuid' })
  publicationId!: string;

  @Column({ name: 'media_id', type: 'uuid' })
  mediaId!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ type: 'text', default: 'gallery' })
  role!: MediaUsageRole;

  @Column({ type: 'integer', default: 0 })
  position!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => PostPublication, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'publication_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  publication!: PostPublication;

  @ManyToOne(() => MediaAsset, { onDelete: 'RESTRICT' })
  @JoinColumn([
    { name: 'media_id', referencedColumnName: 'id' },
    { name: 'site_id', referencedColumnName: 'siteId' },
  ])
  media!: MediaAsset;
}
