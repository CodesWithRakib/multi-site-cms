import { Inject, Injectable, Logger } from '@nestjs/common';
import { type DataSource, type Repository } from 'typeorm';

import { getInitializedRepository } from '../../database/ensure-connected';
import { DATA_SOURCE } from '../../database/database.tokens';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import type { ActorType } from '../../database/entities/types';

export interface RecordAuditEventOptions {
  actorId?: string | null;
  actorType?: ActorType;
  siteId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  private async getAuditRepo(): Promise<Repository<AuditEvent>> {
    return getInitializedRepository(this.dataSource, AuditEvent);
  }

  /**
   * Appends an immutable audit event to the append-only `audit_events` log.
   * Never stores passwords, raw tokens, or sensitive credentials.
   */
  async record(options: RecordAuditEventOptions): Promise<void> {
    try {
      const auditRepo = await this.getAuditRepo();
      const actorType: ActorType = options.actorType ?? (options.actorId ? 'user' : 'system');
      const event = auditRepo.create({
        actorId: actorType === 'user' ? options.actorId : null,
        actorType,
        siteId: options.siteId ?? null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? null,
        requestId: options.requestId ?? null,
        ipAddress: options.ipAddress ?? null,
        metadata: options.metadata ?? {},
      });

      await auditRepo.save(event);
    } catch (err) {
      // Audit recording failures must be logged but never crash the main operation
      // unless transactional guarantees require it.
      const message = err instanceof Error ? err.message : 'Unknown audit error';
      this.logger.error(`Failed to record audit event: ${message}`);
    }
  }
}
