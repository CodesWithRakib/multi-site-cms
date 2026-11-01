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

import type { ActorType } from './types';
import { User } from './user.entity';

/**
 * Append-only record of security-relevant actions.
 *
 * This is the one table with a `bigint` identity primary key instead of a UUID:
 * rows are high-volume, written sequentially, and only ever read in time order, so
 * an ordered surrogate key is cheaper and more useful for pagination than a random
 * UUID. That exception is deliberate and documented in ADR-0008.
 *
 * `actor_id` is nullable for system and bootstrap actions, with `actor_type`
 * carrying the distinction, so no fake user row is invented. Metadata must never
 * contain passwords, tokens, or unnecessary personal data.
 *
 * Append-only is enforced by database privileges for the application role
 * (`INSERT`/`SELECT`), not by a constraint; see docs/database/multi-site-data-isolation.md.
 */
@Entity({ name: 'audit_events' })
@Check('CHK_audit_events_actor_type', "\"actor_type\" IN ('user', 'system', 'bootstrap')")
@Check('CHK_audit_events_action_format', '"action" ~ \'^[a-z][a-z0-9_]*\\.[a-z][a-z0-9_]*$\'')
@Check(
  'CHK_audit_events_actor',
  '("actor_type" = \'user\' AND "actor_id" IS NOT NULL)\n        OR ("actor_type" <> \'user\')',
)
@Check('CHK_audit_events_metadata_object', 'jsonb_typeof("metadata") = \'object\'')
@Index('IDX_audit_events_site_created', ['siteId', 'createdAt'])
@Index('IDX_audit_events_actor_created', ['actorId', 'createdAt'])
@Index('IDX_audit_events_action_created', ['action', 'createdAt'])
@Index('IDX_audit_events_entity', ['entityType', 'entityId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'actor_type', type: 'text', default: 'user' })
  actorType!: ActorType;

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId!: string | null;

  @Column({ type: 'text' })
  action!: string;

  @Column({ name: 'entity_type', type: 'text' })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ name: 'request_id', type: 'text', nullable: true })
  requestId!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor!: User | null;
}
