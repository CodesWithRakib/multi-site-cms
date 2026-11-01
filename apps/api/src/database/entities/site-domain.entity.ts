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
import type { DomainStatus } from './types';

/**
 * A hostname owned by exactly one site. Hostnames are globally unique so a
 * request host can resolve to exactly one tenant; normalization (lowercase, no
 * scheme, no port, no trailing dot) happens in the application before insert and
 * is enforced again here by a check constraint.
 *
 * A row is not proof of ownership: `verified_at` records that the DNS/TXT
 * challenge succeeded. Domain verification itself is a later-phase workflow.
 */
@Entity({ name: 'site_domains' })
@Check(
  'CHK_site_domains_hostname_format',
  '"hostname"::text = lower("hostname"::text)\n        AND "hostname"::text ~ \'^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$\'',
)
@Check('CHK_site_domains_status', "\"status\" IN ('active', 'disabled')")
@Index('IDX_site_domains_site', ['siteId'])
export class SiteDomain {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ type: 'citext', unique: true })
  hostname!: string;

  @Column({ type: 'text', default: 'active' })
  status!: DomainStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Site, (site) => site.domains, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'site_id' })
  site!: Site;
}
