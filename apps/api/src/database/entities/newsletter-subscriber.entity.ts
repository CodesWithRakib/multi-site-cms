import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Site } from './site.entity';

@Entity({ name: 'newsletter_subscribers' })
@Unique('UQ_newsletter_site_email', ['siteId', 'email'])
@Index('IDX_newsletter_site_created', ['siteId', 'createdAt'])
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site?: Site;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 32, default: 'subscribed' })
  status!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

