import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import type { PostPublicationItem } from '@multi-site-cms/types';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { DATA_SOURCE } from '../database/database.tokens';
import { getInitializedRepository } from '../database/ensure-connected';
import { OutboxEvent } from '../database/entities/outbox-event.entity';
import { PostPublicationCategory } from '../database/entities/post-publication-category.entity';
import { PostPublicationTag } from '../database/entities/post-publication-tag.entity';
import { PostPublication } from '../database/entities/post-publication.entity';
import { PostRevision } from '../database/entities/post-revision.entity';
import { Post } from '../database/entities/post.entity';
import { Site } from '../database/entities/site.entity';
import type {
  ArchivePublicationDto,
  CancelScheduleDto,
  ReschedulePublicationDto,
  SchedulePublicationDto,
  UnpublishDto,
} from './dto';
import {
  isValidPublicationTransition,
  OUTBOX_EVENT_TYPES,
  type PublishingHealthStats,
} from './publishing.types';

@Injectable()
export class PublishingService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private async getPublicationRepo(): Promise<Repository<PostPublication>> {
    return getInitializedRepository(this.dataSource, PostPublication);
  }

  private async getPostRepo(): Promise<Repository<Post>> {
    return getInitializedRepository(this.dataSource, Post);
  }

  private async getRevisionRepo(): Promise<Repository<PostRevision>> {
    return getInitializedRepository(this.dataSource, PostRevision);
  }

  private async getSiteRepo(): Promise<Repository<Site>> {
    return getInitializedRepository(this.dataSource, Site);
  }

  private async getPubCategoryRepo(): Promise<Repository<PostPublicationCategory>> {
    return getInitializedRepository(this.dataSource, PostPublicationCategory);
  }

  private async getPubTagRepo(): Promise<Repository<PostPublicationTag>> {
    return getInitializedRepository(this.dataSource, PostPublicationTag);
  }

  private async getOutboxRepo(): Promise<Repository<OutboxEvent>> {
    return getInitializedRepository(this.dataSource, OutboxEvent);
  }

  private checkSiteAccess(actor: EffectiveAuthContext, siteId: string): void {
    if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'sites.notFound');
    }
  }

  /**
   * Validates that the underlying canonical post and pinned revision exist and are complete.
   */
  private async validateContentEligibility(
    postId: string,
    revisionId: string,
    siteId: string,
  ): Promise<{ post: Post; revision: PostRevision; site: Site }> {
    const postRepo = await this.getPostRepo();
    const revisionRepo = await this.getRevisionRepo();
    const siteRepo = await this.getSiteRepo();

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post || post.deletedAt) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'post.notFound');
    }

    const revision = await revisionRepo.findOne({ where: { id: revisionId, postId } });
    if (!revision) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'revision.notFound');
    }

    if (!revision.title?.trim() || !revision.body || Object.keys(revision.body).length === 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.contentNotEligible',
      );
    }

    const site = await siteRepo.findOne({ where: { id: siteId } });
    if (!site || site.status !== 'active') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.siteInactive',
      );
    }

    return { post, revision, site };
  }

  /**
   * Publishes a publication immediately.
   */
  async publishImmediately(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (!isValidPublicationTransition(pub.status, 'published')) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.invalidTransition',
      );
    }

    const { post, revision, site } = await this.validateContentEligibility(
      pub.postId,
      pub.revisionId,
      siteId,
    );

    const previousStatus = pub.status;
    const publishedInstant = new Date();

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'published';
      pub.publishedAt = publishedInstant;
      pub.scheduledFor = null;

      const savedPub = await txPubRepo.save(pub);

      const outboxPayload = {
        publicationId: savedPub.id,
        siteId: savedPub.siteId,
        siteKey: site.key,
        postId: savedPub.postId,
        postType: post.type,
        slug: savedPub.slug,
        title: revision.title || savedPub.slug,
        publishedAt: publishedInstant.toISOString(),
        revisionId: savedPub.revisionId,
        templateKey: savedPub.templateKey,
      };

      // 1. Transactional Outbox Event
      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_PUBLISHED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: outboxPayload,
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      // If Air Sports live update, also emit specialized real-time event
      if (
        site.key === 'air-sports' ||
        post.type === 'air_sports_update' ||
        post.type === 'live_update'
      ) {
        await txOutboxRepo.save(
          txOutboxRepo.create({
            eventType: OUTBOX_EVENT_TYPES.AIR_SPORTS_UPDATE_PUBLISHED,
            eventVersion: 1,
            siteId: savedPub.siteId,
            publicationId: savedPub.id,
            postId: savedPub.postId,
            payload: outboxPayload,
            status: 'pending',
            retryCount: 0,
            maxRetries: 5,
            nextRetryAt: new Date(),
          }),
        );
      }

      // 2. Audit Trail
      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.publish_immediate',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousStatus,
          newStatus: 'published',
          slug: savedPub.slug,
          publishedAt: publishedInstant.toISOString(),
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Schedules a publication for a future date/time.
   */
  async schedulePublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: SchedulePublicationDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (!isValidPublicationTransition(pub.status, 'scheduled')) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.invalidTransition',
      );
    }

    const { site } = await this.validateContentEligibility(
      pub.postId,
      pub.revisionId,
      siteId,
    );

    const scheduledDate = new Date(dto.scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.scheduledTimeInvalid',
      );
    }

    // Must be in the future (at least 5 seconds ahead of now)
    if (scheduledDate.getTime() <= Date.now() + 5000) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.scheduledTimeInPast',
      );
    }

    const previousStatus = pub.status;

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'scheduled';
      pub.scheduledFor = scheduledDate;

      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_SCHEDULED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site.key,
            postId: savedPub.postId,
            slug: savedPub.slug,
            scheduledFor: scheduledDate.toISOString(),
            reason: dto.reason || null,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.schedule',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousStatus,
          newStatus: 'scheduled',
          scheduledFor: scheduledDate.toISOString(),
          reason: dto.reason || null,
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Reschedules an already scheduled publication to a new instant.
   */
  async reschedulePublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: ReschedulePublicationDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (pub.status !== 'scheduled') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.cannotRescheduleNonScheduled',
      );
    }

    const { site } = await this.validateContentEligibility(pub.postId, pub.revisionId, siteId);

    const newScheduledDate = new Date(dto.scheduledFor);
    if (isNaN(newScheduledDate.getTime())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.scheduledTimeInvalid',
      );
    }

    if (newScheduledDate.getTime() <= Date.now() + 5000) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.scheduledTimeInPast',
      );
    }

    const previousScheduledFor = pub.scheduledFor;

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.scheduledFor = newScheduledDate;
      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_RESCHEDULED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site.key,
            postId: savedPub.postId,
            slug: savedPub.slug,
            scheduledFor: newScheduledDate.toISOString(),
            previousScheduledFor: previousScheduledFor ? previousScheduledFor.toISOString() : null,
            reason: dto.reason || null,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.reschedule',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousScheduledFor: previousScheduledFor ? previousScheduledFor.toISOString() : null,
          newScheduledFor: newScheduledDate.toISOString(),
          reason: dto.reason || null,
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Cancels a scheduled publication and returns it to draft state.
   */
  async cancelScheduledPublication(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: CancelScheduleDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (pub.status !== 'scheduled') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.cannotCancelNonScheduled',
      );
    }

    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });

    const previousScheduledFor = pub.scheduledFor;

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'draft';
      pub.scheduledFor = null;
      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_CANCELLED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site ? site.key : 'default',
            postId: savedPub.postId,
            slug: savedPub.slug,
            previousScheduledFor: previousScheduledFor ? previousScheduledFor.toISOString() : null,
            reason: dto.reason || null,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.cancel_schedule',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousScheduledFor: previousScheduledFor ? previousScheduledFor.toISOString() : null,
          reason: dto.reason || null,
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Unpublishes published content and returns it to draft state.
   */
  async unpublish(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: UnpublishDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (pub.status !== 'published') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.cannotUnpublishNonPublished',
      );
    }

    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'draft';
      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_UNPUBLISHED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site ? site.key : 'default',
            postId: savedPub.postId,
            slug: savedPub.slug,
            previousStatus: 'published',
            unpublishedAt: new Date().toISOString(),
            reason: dto.reason || null,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.unpublish',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousStatus: 'published',
          newStatus: 'draft',
          reason: dto.reason || null,
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Archives a publication.
   */
  async archive(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
    dto: ArchivePublicationDto,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (!isValidPublicationTransition(pub.status, 'archived')) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.invalidTransition',
      );
    }

    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });
    const previousStatus = pub.status;

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'archived';
      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_ARCHIVED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site ? site.key : 'default',
            postId: savedPub.postId,
            slug: savedPub.slug,
            previousStatus,
            archivedAt: new Date().toISOString(),
            reason: dto.reason || null,
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.archive',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousStatus,
          newStatus: 'archived',
          reason: dto.reason || null,
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Restores an archived publication to draft.
   */
  async restore(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (pub.status !== 'archived') {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.cannotRestoreNonArchived',
      );
    }

    const siteRepo = await this.getSiteRepo();
    const site = await siteRepo.findOne({ where: { id: siteId } });

    return this.dataSource.transaction(async (manager) => {
      const txPubRepo = manager.getRepository(PostPublication);
      const txOutboxRepo = manager.getRepository(OutboxEvent);

      pub.status = 'draft';
      const savedPub = await txPubRepo.save(pub);

      await txOutboxRepo.save(
        txOutboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_RESTORED,
          eventVersion: 1,
          siteId: savedPub.siteId,
          publicationId: savedPub.id,
          postId: savedPub.postId,
          payload: {
            publicationId: savedPub.id,
            siteId: savedPub.siteId,
            siteKey: site ? site.key : 'default',
            postId: savedPub.postId,
            slug: savedPub.slug,
            restoredAt: new Date().toISOString(),
          },
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        }),
      );

      await this.auditService.record({
        actorId: actor.user.id,
        actorType: 'user',
        siteId,
        action: 'publication.restore',
        entityType: 'post_publication',
        entityId: savedPub.id,
        metadata: {
          previousStatus: 'archived',
          newStatus: 'draft',
        },
      });

      return this.mapToItem(savedPub);
    });
  }

  /**
   * Submits a draft publication for editorial review.
   */
  async submitForReview(
    actor: EffectiveAuthContext,
    siteId: string,
    publicationId: string,
  ): Promise<PostPublicationItem> {
    this.checkSiteAccess(actor, siteId);

    const publicationRepo = await this.getPublicationRepo();
    const pub = await publicationRepo.findOne({ where: { id: publicationId, siteId } });
    if (!pub) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'publication.notFound');
    }

    if (!isValidPublicationTransition(pub.status, 'in_review')) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'publication.invalidTransition',
      );
    }

    pub.status = 'in_review';
    const savedPub = await publicationRepo.save(pub);

    await this.auditService.record({
      actorId: actor.user.id,
      actorType: 'user',
      siteId,
      action: 'publication.submit_review',
      entityType: 'post_publication',
      entityId: savedPub.id,
      metadata: {
        previousStatus: 'draft',
        newStatus: 'in_review',
      },
    });

    return this.mapToItem(savedPub);
  }

  /**
   * Operational health statistics for queues and scheduling.
   */
  async getHealthStats(
    scheduledWorkerActive = false,
    outboxWorkerActive = false,
  ): Promise<PublishingHealthStats> {
    const pubRepo = await this.getPublicationRepo();
    const outboxRepo = await this.getOutboxRepo();

    const pendingScheduled = await pubRepo
      .createQueryBuilder('pp')
      .where("pp.status = 'scheduled' AND pp.scheduled_for IS NOT NULL")
      .getCount();

    const oldestScheduled = await pubRepo
      .createQueryBuilder('pp')
      .select('MIN(pp.scheduled_for)', 'oldest')
      .where("pp.status = 'scheduled' AND pp.scheduled_for IS NOT NULL")
      .getRawOne();

    const outboxBacklog = await outboxRepo.count({ where: { status: 'pending' } });
    const outboxDeadLetter = await outboxRepo.count({ where: { status: 'dead_letter' } });

    return {
      scheduledPublicationsPending: pendingScheduled,
      oldestPendingScheduledFor: oldestScheduled?.oldest
        ? new Date(oldestScheduled.oldest).toISOString()
        : null,
      outboxBacklogPending: outboxBacklog,
      outboxDeadLetterCount: outboxDeadLetter,
      isScheduledWorkerActive: scheduledWorkerActive,
      isOutboxDispatcherActive: outboxWorkerActive,
    };
  }

  private mapToItem(pub: PostPublication): PostPublicationItem {
    return {
      id: pub.id,
      siteId: pub.siteId,
      postId: pub.postId,
      revisionId: pub.revisionId,
      slug: pub.slug,
      status: pub.status,
      scheduledFor: pub.scheduledFor ? pub.scheduledFor.toISOString() : null,
      publishedAt: pub.publishedAt ? pub.publishedAt.toISOString() : null,
      seoTitle: pub.seoTitle,
      seoDescription: pub.seoDescription,
      canonicalUrl: pub.canonicalUrl,
      featuredImageId: pub.featuredImageId,
      templateKey: pub.templateKey,
      eventId: pub.eventId,
      createdAt: pub.createdAt.toISOString(),
      updatedAt: pub.updatedAt.toISOString(),
    };
  }
}
