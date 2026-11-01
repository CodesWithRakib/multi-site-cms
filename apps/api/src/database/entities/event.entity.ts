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
import type { EventStatus } from './types';

/**
 * A live event owned by one site, used by the air sports publication.
 *
 * Deliberately minimal: no sessions, stages, or participants yet. A live update
 * is a normal post of type `live_update` whose publication references this event,
 * ordered by `published_at`. That keeps the timeline in one place (publications)
 * instead of introducing a second content store before the requirement exists.
 */
@Entity({ name: 'events' })
@Check('CHK_events_slug_format', '"slug"::text ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\'')
@Check('CHK_events_status', "\"status\" IN ('scheduled', 'live', 'completed', 'cancelled')")
@Check('CHK_events_time_range', '"ends_at" IS NULL OR "ends_at" >= "starts_at"')
@Check('CHK_events_title_not_blank', 'length(btrim("name")) > 0')
@Index('IDX_events_site_start', ['siteId', 'startsAt'])
export class Event {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ type: 'citext' })
  slug!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', default: 'scheduled' })
  status!: EventStatus;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt!: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

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
