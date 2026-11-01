import { Inject, Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../../database/database.tokens';
import { OutboxEvent } from '../../database/entities/outbox-event.entity';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';
import {
  OUTBOX_EVENT_TYPES,
  type PublicationPublishedPayload,
  type PublicationUnpublishedPayload,
} from '../publishing.types';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class OutboxDispatcherWorker implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isProcessing = false;

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly realtimeService: RealtimeService,
  ) {}

  start(intervalMs = 3000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log(`Outbox dispatcher worker started (interval: ${intervalMs}ms)`);

    this.timer = setInterval(async () => {
      if (this.isProcessing) return;
      try {
        this.isProcessing = true;
        await this.processDueEvents();
      } catch (err: unknown) {
        this.logger.error('Error during outbox dispatcher batch run', (err as Error).stack);
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
    this.logger.log('Outbox dispatcher worker stopped');
  }

  onModuleDestroy(): void {
    this.stop();
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Scans and dispatches due outbox events.
   * Uses FOR UPDATE SKIP LOCKED to prevent duplicate delivery across concurrent workers.
   */
  async processDueEvents(batchSize = 25): Promise<number> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      return 0;
    }

    let dispatchedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      const dueEvents: Array<{ id: string }> = await manager.query(
        `
        SELECT "id"
        FROM "outbox_events"
        WHERE "status" = 'pending'
          AND "next_retry_at" <= NOW()
        ORDER BY "created_at" ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
        [batchSize],
      );

      if (!dueEvents || dueEvents.length === 0) {
        return;
      }

      const outboxRepo = manager.getRepository(OutboxEvent);

      for (const item of dueEvents) {
        const event = await outboxRepo.findOne({ where: { id: item.id } });
        if (!event || event.status !== 'pending') {
          continue;
        }

        try {
          await this.dispatchEvent(event);

          // Mark event completed
          event.status = 'completed';
          event.processedAt = new Date();
          event.lastError = null;
          await outboxRepo.save(event);
          dispatchedCount++;
        } catch (err: unknown) {
          const errMsg = (err as Error).message || 'Dispatch failure';
          this.logger.warn(`Failed to dispatch outbox event ${event.id}: ${errMsg}`);

          const nextRetryCount = event.retryCount + 1;
          event.retryCount = nextRetryCount;
          event.lastError = errMsg;

          if (nextRetryCount >= event.maxRetries) {
            event.status = 'dead_letter';
            this.logger.error(
              `Outbox event ${event.id} (${event.eventType}) moved to DEAD_LETTER after ${nextRetryCount} retries`,
            );
          } else {
            // Exponential backoff: base 1s * 2^retries, capped at 5 minutes
            const backoffMs = Math.min(300_000, 1000 * Math.pow(2, nextRetryCount));
            event.nextRetryAt = new Date(Date.now() + backoffMs);
          }

          await outboxRepo.save(event);
        }
      }
    });

    return dispatchedCount;
  }

  /**
   * Routes an outbox event to its designated handlers.
   */
  private async dispatchEvent(event: OutboxEvent): Promise<void> {
    const payload = event.payload;
    const siteKey = (payload.siteKey as string) || 'default';

    switch (event.eventType) {
      case OUTBOX_EVENT_TYPES.PUBLICATION_PUBLISHED:
      case OUTBOX_EVENT_TYPES.PUBLICATION_UNPUBLISHED:
      case OUTBOX_EVENT_TYPES.PUBLICATION_ARCHIVED: {
        const typedPayload = payload as unknown as
          PublicationPublishedPayload | PublicationUnpublishedPayload;
        const paths = this.cacheInvalidationService.derivePathsForPublication(typedPayload);
        const result = await this.cacheInvalidationService.revalidatePaths(siteKey, paths);

        if (!result.success && result.error) {
          throw new Error(`Cache revalidation failed: ${result.error}`);
        }
        break;
      }

      case OUTBOX_EVENT_TYPES.AIR_SPORTS_UPDATE_PUBLISHED: {
        const typedPayload = payload as unknown as PublicationPublishedPayload;
        this.realtimeService.broadcast(
          siteKey,
          typedPayload,
          event.id,
          OUTBOX_EVENT_TYPES.AIR_SPORTS_UPDATE_PUBLISHED,
        );
        break;
      }

      default:
        this.logger.debug(
          `No explicit side-effect handler for outbox event type: ${event.eventType}`,
        );
        break;
    }
  }
}
