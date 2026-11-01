import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { SiteDomain } from './site-domain.entity';
import type { SiteStatus } from './types';
import { User } from './user.entity';

/**
 * The tenant registry. A site is data, never an enum or a hardcoded list, so
 * adding a publication is an insert rather than a deployment of new branches.
 *
 * `settings` holds non-secret presentation configuration (branding, default SEO,
 * navigation). Anything that affects authorization or billing must be a typed
 * column, not JSON.
 */
@Entity({ name: 'sites' })
@Check('CHK_sites_key_format', '"key"::text ~ \'^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$\'')
@Check('CHK_sites_status', "\"status\" IN ('active', 'paused', 'archived', 'suspended')")
@Check('CHK_sites_settings_object', 'jsonb_typeof("settings") = \'object\'')
@Check('CHK_sites_locale_format', '"default_locale" ~ \'^[a-zA-Z]{2,8}(-[a-zA-Z0-9]{2,8})*$\'')
@Index('IDX_sites_status', ['status'])
export class Site {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'citext', unique: true })
  key!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'default_locale', type: 'text', default: 'en' })
  defaultLocale!: string;

  @Column({ type: 'text', default: 'UTC' })
  timezone!: string;

  @Column({ type: 'text', default: 'active' })
  status!: SiteStatus;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  settings!: Record<string, unknown>;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User | null;

  @OneToMany(() => SiteDomain, (domain) => domain.site)
  domains!: SiteDomain[];
}
