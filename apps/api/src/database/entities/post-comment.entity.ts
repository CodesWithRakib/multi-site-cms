import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PostPublication } from './post-publication.entity';
import { Site } from './site.entity';

export type PostCommentStatus = 'approved' | 'pending' | 'rejected' | 'spam';

@Entity({ name: 'post_comments' })
@Index('IDX_post_comments_pub_status_created', ['publicationId', 'status', 'createdAt'])
@Index('IDX_post_comments_site_status_created', ['siteId', 'status', 'createdAt'])
export class PostComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site?: Site;

  @Column({ name: 'publication_id', type: 'uuid' })
  publicationId!: string;

  @ManyToOne(() => PostPublication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'publication_id' })
  publication?: PostPublication;

  @Column({ name: 'author_name', type: 'varchar', length: 100 })
  authorName!: string;

  @Column({ name: 'author_email', type: 'varchar', length: 255 })
  authorEmail!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'smallint', nullable: true })
  rating!: number | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status!: PostCommentStatus;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => PostComment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: PostComment | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
