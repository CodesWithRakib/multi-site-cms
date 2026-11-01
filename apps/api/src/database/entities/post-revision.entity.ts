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

import { Post } from './post.entity';
import { User } from './user.entity';

/**
 * Immutable content snapshot. Editing a post inserts a new revision; restoring an
 * old one inserts a new revision with the old content. Rows are never updated.
 *
 * Revision numbers are dense per post and enforced unique. The composite unique
 * key `(post_id, id)` exists so a publication can pin a revision with a foreign
 * key that also proves the revision belongs to that post.
 *
 * `body` is a JSONB Tiptap document. JSONB is appropriate here because the editor
 * document is a tree whose shape is owned by the editor, not by the relational
 * model. Relational facts (author, post, timestamp, number) stay in columns.
 */
@Entity({ name: 'post_revisions' })
@Check('CHK_post_revisions_number', '"revision_number" >= 1')
@Check('CHK_post_revisions_title', 'length(btrim("title")) > 0')
@Check('CHK_post_revisions_body_object', 'jsonb_typeof("body") = \'object\'')
@Index('IDX_post_revisions_post_number', ['postId', 'revisionNumber'])
export class PostRevision {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @Column({ name: 'revision_number', type: 'integer' })
  revisionNumber!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  excerpt!: string | null;

  @Column({ type: 'jsonb' })
  body!: Record<string, unknown>;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User;
}
