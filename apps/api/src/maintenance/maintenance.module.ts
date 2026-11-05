import { Module, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';

import { AuditModule } from '../common/audit/audit.module';
import { env } from '../config/env';
import { DatabaseModule } from '../database/database.module';
import { RetentionJob } from './retention.job';

/** Background housekeeping: data retention. */
@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [RetentionJob],
  exports: [RetentionJob],
})
export class MaintenanceModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly retentionJob: RetentionJob) {}

  onModuleInit(): void {
    // Test suites call `purge()` directly instead of leaving timers open.
    if (env.NODE_ENV !== 'test' && env.RETENTION_JOB_ENABLED === 'true') {
      this.retentionJob.start();
    }
  }

  onModuleDestroy(): void {
    this.retentionJob.stop();
  }
}
