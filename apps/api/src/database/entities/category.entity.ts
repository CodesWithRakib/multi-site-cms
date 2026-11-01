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

/**
 * Site-owned category. Taxonomy is deliberately site-specific in v1: a travel
 * destination category must never appear in an air sports navigation, and a
 * shared pool would require an extra visibility model to prevent it.
 *
 * Uniqueness is `(site_id, slug)`. The redundant-looking unique key `(id,
 * site_id)` exists so publication joins can prove the category and publication
 * belong to the same site with a composite foreign key.
 */
@Entity({ name: 'categories' })
@Check('CHK_categories_slug_format', '"slug"::text ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\'')
@Check('CHK_categories_slug_length', 'char_length("slug"::text) BETWEEN 1 AND 96')
@Index('IDX_categories_site', ['siteId'])
export class Category {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site!: Site;
}
