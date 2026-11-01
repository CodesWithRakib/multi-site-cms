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

import { Site } from './site.entity';

/**
 * Site-owned tag. Same isolation rationale as `categories`: uniqueness is
 * `(site_id, slug)` and the composite key `(id, site_id)` supports same-site
 * enforcement on publication joins.
 */
@Entity({ name: 'tags' })
@Check('CHK_tags_slug_format', '"slug"::text ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\'')
@Check('CHK_tags_slug_length', 'char_length("slug"::text) BETWEEN 1 AND 96')
@Index('IDX_tags_site', ['siteId'])
export class Tag {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site!: Site;
}
