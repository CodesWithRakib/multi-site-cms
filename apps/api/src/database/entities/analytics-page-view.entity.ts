import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';
import { Site } from './site.entity';

@Entity({ name: 'analytics_page_views' })
@Check('CHK_analytics_page_views_device', "\"device_type\" IN ('desktop', 'mobile', 'tablet')")
@Check(
  'CHK_analytics_page_views_source',
  "\"referrer_source\" IN ('direct', 'search', 'social', 'newsletter', 'referral')",
)
@Index('IDX_analytics_site_created', ['siteId', 'createdAt'])
@Index('IDX_analytics_post_created', ['postId', 'createdAt'])
@Index('IDX_analytics_created', ['createdAt'])
@Index('IDX_analytics_site_path', ['siteId', 'path'])
export class AnalyticsPageView {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @ManyToOne(() => Site, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site?: Site;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId!: string | null;

  @ManyToOne(() => Post, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post?: Post | null;

  @Column({ name: 'path', type: 'text' })
  path!: string;

  @Column({ name: 'referrer', type: 'text', nullable: true })
  referrer!: string | null;

  @Column({ name: 'referrer_source', type: 'text', default: 'direct' })
  referrerSource!: string;

  @Column({ name: 'visitor_id', type: 'text' })
  visitorId!: string;

  @Column({ name: 'device_type', type: 'text', default: 'desktop' })
  deviceType!: string;

  @Column({ name: 'browser', type: 'text', default: 'chrome' })
  browser!: string;

  @Column({ name: 'os', type: 'text', default: 'windows' })
  os!: string;

  @Column({ name: 'country_code', type: 'text', default: 'US' })
  countryCode!: string;

  @Column({ name: 'country_name', type: 'text', default: 'United States' })
  countryName!: string;

  @Column({ name: 'duration_seconds', type: 'integer', default: 45 })
  durationSeconds!: number;

  @Column({ name: 'is_unique', type: 'boolean', default: true })
  isUnique!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
