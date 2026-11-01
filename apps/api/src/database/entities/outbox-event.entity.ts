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
import type { OutboxStatus } from './types';

/**
 * Transactional outbox event.
 *
 * Persisted atomically within the same database transaction as business state mutations
 * (such as publication status transitions). A dedicated dispatcher reads due events with
 * `FOR UPDATE SKIP LOCKED` and performs side effects (Next.js cache revalidation,
 * real-time SSE broadcasts) with guaranteed at-least-once delivery and exponential backoff.
 */
@Entity({ name: 'outbox_events' })
@Check(
  'CHK_outbox_events_status',
  "\"status\" IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')",
)
@Index('IDX_outbox_events_due', ['status', 'nextRetryAt'])
@Index('IDX_outbox_events_site', ['siteId', 'createdAt'])
@Index('IDX_outbox_events_pub', ['publicationId'])
export class OutboxEvent {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'event_type', type: 'text' })
  eventType!: string;

  @Column({ name: 'event_version', type: 'integer', default: 1 })
  eventVersion!: number;

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId!: string | null;

  @Column({ name: 'publication_id', type: 'uuid', nullable: true })
  publicationId!: string | null;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'text', default: 'pending' })
  status!: OutboxStatus;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ name: 'max_retries', type: 'integer', default: 5 })
  maxRetries!: number;

  @Column({ name: 'next_retry_at', type: 'timestamptz', default: () => 'now()' })
  nextRetryAt!: Date;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Site, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'site_id' })
  site!: Site | null;
}
