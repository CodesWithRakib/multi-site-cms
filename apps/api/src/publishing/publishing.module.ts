import { Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { AuditModule } from '../common/audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { CacheInvalidationService } from './cache/cache-invalidation.service';
import { OutboxDispatcherWorker } from './jobs/outbox-dispatcher.worker';
import { ScheduledPublicationWorker } from './jobs/scheduled-publication.worker';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { RealtimeController } from './realtime/realtime.controller';
import { RealtimeService } from './realtime/realtime.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [PublishingController, RealtimeController],
  providers: [
    PublishingService,
    CacheInvalidationService,
    RealtimeService,
    ScheduledPublicationWorker,
    OutboxDispatcherWorker,
  ],
  exports: [
    PublishingService,
    CacheInvalidationService,
    RealtimeService,
    ScheduledPublicationWorker,
    OutboxDispatcherWorker,
  ],
})
export class PublishingModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly scheduledWorker: ScheduledPublicationWorker,
    private readonly outboxWorker: OutboxDispatcherWorker,
  ) {}

  onModuleInit(): void {
    // In automated testing environments, avoid autonomous background polling loops
    // that keep timers open; test suites call worker methods directly.
    if (process.env.NODE_ENV !== 'test') {
      this.scheduledWorker.start(5000);
      this.outboxWorker.start(3000);
    }
  }

  onModuleDestroy(): void {
    this.scheduledWorker.stop();
    this.outboxWorker.stop();
  }
}
