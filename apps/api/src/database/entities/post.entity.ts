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

import type { PostStatus, PostType } from './types';
import { User } from './user.entity';

/**
 * Canonical, site-neutral content identity. There is deliberately no `site_id`:
 * a post may be published to one site, several sites, or none. Site-specific URL,
 * SEO, and publication state live on `post_publications`.
 *
 * Editorial fields are not stored here; they are immutable snapshots in
 * `post_revisions`, so a reader never observes a half-edited body and history is
 * recoverable.
 *
 * `deleted_at` is the only soft-delete in the schema: content deletion is
 * reversible only through an explicit Super Admin workflow. Soft-deleted posts
 * must never reach a public query; services filter `deleted_at IS NULL` and
 * publication rows are archived in the same transaction.
 */
@Entity({ name: 'posts' })
@Check('CHK_posts_type', "\"type\" IN ('article', 'guide', 'news', 'live_update')")
@Check('CHK_posts_status', "\"status\" IN ('draft', 'in_review', 'approved', 'archived')")
@Index('IDX_posts_author_created', ['authorId', 'createdAt'])
@Index('IDX_posts_status_updated', ['status', 'updatedAt'])
export class Post {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text', default: 'article' })
  type!: PostType;

  @Column({ type: 'text', default: 'draft' })
  status!: PostStatus;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'author_id' })
  author!: User;
}
