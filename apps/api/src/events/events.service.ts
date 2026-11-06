import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';

import type { EventItem, PaginatedResult } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { Event } from '../database/entities/event.entity';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { Site } from '../database/entities/site.entity';
import { OUTBOX_EVENT_TYPES, type EventChangedPayload } from '../publishing/publishing.types';
import type { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from './dto';

/**
 * Site events (air sports competitions, festivals, meets).
 *
 * Every write records an audit event and enqueues an `event.changed` outbox row
 * in the same transaction, so the public site's event pages are revalidated
 * exactly when the change commits.
 */
@Injectable()
export class EventsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async list(
    actor: EffectiveAuthContext,
    siteId: string,
    query: ListEventsQueryDto,
  ): Promise<PaginatedResult<EventItem>> {
    this.checkSiteAccess(actor, siteId);
    await this.ready();

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));

    const qb = this.dataSource
      .getRepository(Event)
      .createQueryBuilder('event')
      .where('event.site_id = :siteId', { siteId })
      .orderBy('event.starts_at', 'DESC')
      .addOrderBy('event.name', 'ASC');

    if (query.search?.trim()) {
      qb.andWhere('(event.name ILIKE :search OR event.slug ILIKE :search)', {
        search: `%${escapeLike(query.search.trim())}%`,
      });
    }
    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    const [events, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const counts = await this.publicationCounts(events.map((event) => event.id));

    return {
      items: events.map((event) => toItem(event, counts.get(event.id) ?? 0)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async get(actor: EffectiveAuthContext, siteId: string, eventId: string): Promise<EventItem> {
    this.checkSiteAccess(actor, siteId);
    await this.ready();
    const event = await this.findOrThrow(this.dataSource.manager, siteId, eventId);
    const counts = await this.publicationCounts([event.id]);
    return toItem(event, counts.get(event.id) ?? 0);
  }

  async create(
    actor: EffectiveAuthContext,
    siteId: string,
    dto: CreateEventDto,
  ): Promise<EventItem> {
    this.checkSiteAccess(actor, siteId);
    await this.ready();
    const site = await this.findSite(siteId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    assertTimeRange(startsAt, endsAt);
    const slug = dto.slug.trim().toLowerCase();

    const saved = await this.dataSource.transaction(async (manager) => {
      await this.assertSlugFree(manager, siteId, slug);
      const repo = manager.getRepository(Event);
      const event = await repo.save(
        repo.create({
          siteId,
          slug,
          name: dto.name.trim(),
          status: dto.status ?? 'scheduled',
          startsAt,
          endsAt,
          description: dto.description?.trim() || null,
        }),
      );
      await this.enqueueChange(manager, site, event, null);
      return event;
    });

    await this.audit(actor, siteId, 'event.create', saved, { name: saved.name, slug });
    return toItem(saved, 0);
  }

  async update(
    actor: EffectiveAuthContext,
    siteId: string,
    eventId: string,
    dto: UpdateEventDto,
  ): Promise<EventItem> {
    this.checkSiteAccess(actor, siteId);
    await this.ready();
    const site = await this.findSite(siteId);

    const saved = await this.dataSource.transaction(async (manager) => {
      const event = await this.findOrThrow(manager, siteId, eventId);
      const previousSlug = event.slug;

      if (dto.slug !== undefined) {
        const slug = dto.slug.trim().toLowerCase();
        if (slug !== event.slug) {
          await this.assertSlugFree(manager, siteId, slug);
          event.slug = slug;
        }
      }
      if (dto.name !== undefined) event.name = dto.name.trim();
      if (dto.status !== undefined) event.status = dto.status;
      if (dto.startsAt !== undefined) event.startsAt = new Date(dto.startsAt);
      if (dto.endsAt !== undefined) event.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
      if (dto.description !== undefined) event.description = dto.description?.trim() || null;
      assertTimeRange(event.startsAt, event.endsAt);

      const updated = await manager.getRepository(Event).save(event);
      await this.enqueueChange(
        manager,
        site,
        updated,
        previousSlug !== updated.slug ? previousSlug : null,
      );
      return updated;
    });

    await this.audit(actor, siteId, 'event.update', saved, { changes: Object.keys(dto) });
    const counts = await this.publicationCounts([saved.id]);
    return toItem(saved, counts.get(saved.id) ?? 0);
  }

  /**
   * Deletes an event. Publications that reported on it stay published and are
   * simply detached: the composite FK's `ON DELETE SET NULL` would also try to
   * null `site_id`, so `event_id` is cleared explicitly first.
   */
  async remove(actor: EffectiveAuthContext, siteId: string, eventId: string): Promise<void> {
    this.checkSiteAccess(actor, siteId);
    await this.ready();
    const site = await this.findSite(siteId);

    const removed = await this.dataSource.transaction(async (manager) => {
      const event = await this.findOrThrow(manager, siteId, eventId);
      await manager
        .createQueryBuilder()
        .update(PostPublication)
        .set({ eventId: null })
        .where('event_id = :eventId AND site_id = :siteId', { eventId, siteId })
        .execute();
      await manager.getRepository(Event).delete({ id: event.id, siteId });
      await this.enqueueChange(manager, site, event, null);
      return event;
    });

    await this.audit(actor, siteId, 'event.delete', removed, {
      name: removed.name,
      slug: removed.slug,
    });
  }

  /** ADR-0015: the DataSource connects lazily on first use. */
  private async ready(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

  private checkSiteAccess(actor: EffectiveAuthContext, siteId: string): void {
    if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }
  }

  private async findSite(siteId: string): Promise<Site> {
    const site = await this.dataSource.getRepository(Site).findOne({ where: { id: siteId } });
    if (!site) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }
    return site;
  }

  private async findOrThrow(
    manager: EntityManager,
    siteId: string,
    eventId: string,
  ): Promise<Event> {
    const event = await manager.getRepository(Event).findOne({ where: { id: eventId, siteId } });
    if (!event) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'event.notFound');
    }
    return event;
  }

  private async assertSlugFree(manager: EntityManager, siteId: string, slug: string) {
    if (await manager.getRepository(Event).exists({ where: { siteId, slug } })) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'event.slugConflict');
    }
  }

  private async publicationCounts(eventIds: string[]): Promise<Map<string, number>> {
    if (eventIds.length === 0) return new Map();
    const rows = await this.dataSource
      .getRepository(PostPublication)
      .createQueryBuilder('pub')
      .select('pub.event_id', 'eventId')
      .addSelect('COUNT(*)', 'count')
      .where('pub.event_id IN (:...eventIds)', { eventIds })
      .groupBy('pub.event_id')
      .getRawMany<{ eventId: string; count: string }>();
    return new Map(rows.map((row) => [row.eventId, Number.parseInt(row.count, 10) || 0]));
  }

  private async enqueueChange(
    manager: EntityManager,
    site: Site,
    event: Event,
    previousSlug: string | null,
  ): Promise<void> {
    const payload: EventChangedPayload = {
      eventId: event.id,
      siteId: site.id,
      siteKey: site.key,
      slug: event.slug,
      previousSlug,
    };
    const outbox = manager.getRepository(OutboxEvent);
    await outbox.save(
      outbox.create({
        eventType: OUTBOX_EVENT_TYPES.EVENT_CHANGED,
        eventVersion: 1,
        siteId: site.id,
        payload: { ...payload },
        status: 'pending',
      }),
    );
  }

  private audit(
    actor: EffectiveAuthContext,
    siteId: string,
    action: string,
    event: Event,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    return this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action,
      entityType: 'event',
      entityId: event.id,
      metadata,
    });
  }
}

function assertTimeRange(startsAt: Date, endsAt: Date | null): void {
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'event.invalidTimeRange');
  }
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function toItem(event: Event, publicationCount: number): EventItem {
  return {
    id: event.id,
    siteId: event.siteId,
    slug: event.slug,
    name: event.name,
    status: event.status,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    description: event.description,
    publicationCount,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
