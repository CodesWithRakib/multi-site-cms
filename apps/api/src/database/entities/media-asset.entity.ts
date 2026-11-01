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

import { Site } from './site.entity';
import type { MediaStatus } from './types';
import { User } from './user.entity';

/**
 * Metadata for an object stored outside PostgreSQL. Binary content is never held
 * in the database; the row holds the provider, an opaque key, and descriptive
 * metadata.
 *
 * `site_id` is nullable only for platform assets owned by a Super Admin. That is
 * a deliberate, auditable promotion, not a default: cross-site reuse of a private
 * asset through a normal publication is impossible because same-site references
 * are enforced by composite foreign keys.
 *
 * Nothing here may hold a provider secret, a signed URL, or a temporary token.
 * `storage_key` is opaque and never derived from a user-supplied filename.
 */
@Entity({ name: 'media_assets' })
@Check('CHK_media_assets_provider_format', '"storage_provider" ~ \'^[a-z][a-z0-9-]{0,31}$\'')
@Check('CHK_media_assets_storage_key_not_blank', 'length(btrim("storage_key")) > 0')
@Check('CHK_media_assets_mime_type', '"mime_type" ~ \'^[a-z0-9.+-]+/[a-z0-9.+-]+$\'')
@Check('CHK_media_assets_byte_size', '"byte_size" > 0')
@Check(
  'CHK_media_assets_dimensions',
  '("width" IS NULL AND "height" IS NULL)\n        OR ("width" IS NOT NULL AND "height" IS NOT NULL\n            AND "width" > 0 AND "height" > 0)',
)
@Check('CHK_media_assets_checksum', 'char_length("checksum") BETWEEN 32 AND 128')
@Check('CHK_media_assets_status', "\"status\" IN ('active', 'archived')")
@Index('IDX_media_assets_site_created', ['siteId', 'createdAt'])
@Index('IDX_media_assets_checksum', ['checksum'])
export class MediaAsset {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId!: string | null;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy!: string | null;

  @Column({ name: 'storage_provider', type: 'text', default: 'local' })
  storageProvider!: string;

  @Column({ name: 'storage_key', type: 'text', unique: true })
  storageKey!: string;

  @Column({ name: 'original_filename', type: 'text', nullable: true })
  originalFilename!: string | null;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType!: string;

  @Column({ name: 'byte_size', type: 'bigint' })
  byteSize!: string;

  @Column({ type: 'text' })
  checksum!: string;

  @Column({ type: 'integer', nullable: true })
  width!: number | null;

  @Column({ type: 'integer', nullable: true })
  height!: number | null;

  @Column({ name: 'alt_text', type: 'text', nullable: true })
  altText!: string | null;

  @Column({ type: 'text', nullable: true })
  caption!: string | null;

  @Column({ type: 'text', default: 'active' })
  status!: MediaStatus;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Site, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'site_id' })
  site!: Site | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser!: User | null;
}
