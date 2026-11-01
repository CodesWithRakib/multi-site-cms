import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from '../../common/audit/audit.service';
import { DATA_SOURCE } from '../../database/database.tokens';
import { OutboxEvent } from '../../database/entities/outbox-event.entity';
import { PostPublication } from '../../database/entities/post-publication.entity';
import { PostRevision } from '../../database/entities/post-revision.entity';
import { Post } from '../../database/entities/post.entity';
import { Site } from '../../database/entities/site.entity';
import { OUTBOX_EVENT_TYPES } from '../publishing.types';

@Injectable()
export class ScheduledPublicationWorker implements OnModuleDestroy {
  private readonly logger = new Logger(ScheduledPublicationWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isProcessing = false;

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Starts background polling for due scheduled publications.
   * Default polling interval: 5000ms (5 seconds).
   */
  start(intervalMs = 5000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log(`Scheduled publication worker started (interval: ${intervalMs}ms)`);

    this.timer = setInterval(async () => {
      if (this.isProcessing) return;
      try {
        this.isProcessing = true;
        await this.processDuePublications();
      } catch (err: unknown) {
        this.logger.error('Error during scheduled publications batch run', (err as Error).stack);
      } finally {
        this.isProcessing = false;
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.logger.log('Scheduled publication worker stopped');
  }

  onModuleDestroy(): void {
    this.stop();
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Scans and executes due scheduled publications atomically.
   * Uses PostgreSQL `FOR UPDATE SKIP LOCKED` to guarantee safe multi-worker concurrency
   * without duplicate processing or race conditions.
   */
  async processDuePublications(batchSize = 25): Promise<number> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      return 0;
    }

    let processedCount = 0;

    // Run inside a serializable / repeatable transaction
    await this.dataSource.transaction(async (manager) => {
      // 1. Lock and claim due scheduled publications
      const duePublications: Array<{ id: string }> = await manager.query(
        `
        SELECT "id"
        FROM "post_publications"
        WHERE "status" = 'scheduled'
          AND "scheduled_for" IS NOT NULL
          AND "scheduled_for" <= NOW()
        ORDER BY "scheduled_for" ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
        [batchSize],
      );

      if (!duePublications || duePublications.length === 0) {
        return;
      }

      const pubRepo = manager.getRepository(PostPublication);
      const postRepo = manager.getRepository(Post);
      const revisionRepo = manager.getRepository(PostRevision);
      const siteRepo = manager.getRepository(Site);
      const outboxRepo = manager.getRepository(OutboxEvent);

      for (const item of duePublications) {
        const publication = await pubRepo.findOne({
          where: { id: item.id },
          relations: { site: true },
        });

        if (!publication || publication.status !== 'scheduled') {
          continue; // Already changed or invalidated
        }

        // 2. Validate source content eligibility
        const post = await postRepo.findOne({
          where: { id: publication.postId },
        });

        const revision = await revisionRepo.findOne({
          where: { id: publication.revisionId },
        });

        if (!post || post.deletedAt || !revision) {
          this.logger.warn(
            `Scheduled publication ${publication.id} skipped: post ${publication.postId} or revision ${publication.revisionId} is missing or deleted`,
          );
          publication.status = 'draft';
          await pubRepo.save(publication);
          continue;
        }

        const site =
          publication.site || (await siteRepo.findOne({ where: { id: publication.siteId } }));
        if (!site || site.status !== 'active') {
          this.logger.warn(
            `Scheduled publication ${publication.id} skipped: site ${publication.siteId} is not active`,
          );
          publication.status = 'draft';
          await pubRepo.save(publication);
          continue;
        }

        // 3. Transition to published
        const publishedInstant = new Date();
        publication.status = 'published';
        publication.publishedAt = publishedInstant;
        await pubRepo.save(publication);

        // 4. Atomically persist transactional outbox event
        const siteKey = site.key;
        const postType = post.type;
        const outboxPayload = {
          publicationId: publication.id,
          siteId: publication.siteId,
          siteKey,
          postId: publication.postId,
          postType,
          slug: publication.slug,
          title: revision.title,
          publishedAt: publishedInstant.toISOString(),
          revisionId: publication.revisionId,
          templateKey: publication.templateKey,
        };

        const outboxEvent = outboxRepo.create({
          eventType: OUTBOX_EVENT_TYPES.PUBLICATION_PUBLISHED,
          eventVersion: 1,
          siteId: publication.siteId,
          publicationId: publication.id,
          postId: publication.postId,
          payload: outboxPayload,
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        });
        await outboxRepo.save(outboxEvent);

        // If Air Sports live update, also emit specialized air sports event
        if (
          siteKey === 'air-sports' ||
          postType === 'air_sports_update' ||
          postType === 'live_update'
        ) {
          const airSportsEvent = outboxRepo.create({
            eventType: OUTBOX_EVENT_TYPES.AIR_SPORTS_UPDATE_PUBLISHED,
            eventVersion: 1,
            siteId: publication.siteId,
            publicationId: publication.id,
            postId: publication.postId,
            payload: outboxPayload,
            status: 'pending',
            retryCount: 0,
            maxRetries: 5,
            nextRetryAt: new Date(),
          });
          await outboxRepo.save(airSportsEvent);
        }

        // 5. Record audit trail
        await this.auditService.record({
          actorId: 'system',
          actorType: 'system',
          siteId: publication.siteId,
          action: 'publication.scheduled_publish',
          entityType: 'post_publication',
          entityId: publication.id,
          metadata: {
            slug: publication.slug,
            scheduledFor: publication.scheduledFor?.toISOString(),
            publishedAt: publishedInstant.toISOString(),
          },
        });

        processedCount++;
        this.logger.log(
          `Published scheduled item: [${publication.slug}] on site [${siteKey}] at ${publishedInstant.toISOString()}`,
        );
      }
    });

    return processedCount;
  }
}
