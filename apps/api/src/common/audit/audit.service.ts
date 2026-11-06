import { decodeIdCursor, encodeIdCursor } from '../pagination/cursor';
import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import type { AuditLogItem, AuditLogSummary, PaginatedAuditLogs } from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

import type { EffectiveAuthContext } from '../../auth/services/authorization.service';
import { DATA_SOURCE } from '../../database/database.tokens';
import { getInitializedRepository } from '../../database/ensure-connected';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import type { ActorType } from '../../database/entities/types';
import type { AuditLogQueryDto } from './dto/audit-log-query.dto';

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

interface RawAuditRow {
  id: string | number;
  actorId: string | null;
  actorType: ActorType;
  siteId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string;
  actorName: string | null;
  actorEmail: string | null;
  siteName: string | null;
  siteKey: string | null;
}

interface RawSummaryRow {
  totalEvents?: string | number;
  securityAuthEvents?: string | number;
  contentEvents?: string | number;
  systemRoleEvents?: string | number;
  uniqueActorsCount?: string | number;
  activeSitesCount?: string | number;
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
      const message = err instanceof Error ? err.message : 'Unknown audit error';
      this.logger.error(`Failed to record audit event: ${message}`);
    }
  }

  /**
   * Queries paginated and filtered audit events with multi-tenant RBAC enforcement.
   */
  async listAuditLogs(
    actor: EffectiveAuthContext,
    query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogs> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const cursorId = query.cursor ? decodeIdCursor(query.cursor) : null;
    // Keyset mode never skips rows: the cursor replaces OFFSET.
    const offset = cursorId ? 0 : (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    // Multi-tenant site isolation
    if (query.siteId) {
      if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(query.siteId)) {
        throw new ForbiddenException('Forbidden: insufficient site permissions');
      }
      conditions.push(`ae.site_id = $${pIdx++}`);
      params.push(query.siteId);
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        conditions.push(`ae.site_id = ANY($${pIdx++})`);
        params.push(actor.authorizedSiteIds);
      } else {
        return { items: [], total: 0, page, limit, totalPages: 0, nextCursor: null };
      }
    }

    if (query.action) {
      conditions.push(`ae.action ILIKE $${pIdx++}`);
      params.push(`%${query.action}%`);
    }

    if (query.category && query.category !== 'all') {
      if (query.category === 'auth') {
        conditions.push(`ae.action LIKE 'auth.%'`);
      } else if (query.category === 'content') {
        conditions.push(
          `(ae.action LIKE 'post.%' OR ae.action LIKE 'publication.%' OR ae.action LIKE 'taxonomy.%' OR ae.action LIKE 'comment.%')`,
        );
      } else if (query.category === 'media') {
        conditions.push(`ae.action LIKE 'media.%'`);
      } else if (query.category === 'user') {
        conditions.push(`(ae.action LIKE 'user.%' OR ae.action LIKE 'role.%')`);
      } else if (query.category === 'system') {
        conditions.push(
          `(ae.actor_type IN ('system', 'bootstrap') OR ae.action LIKE 'site.%' OR ae.action LIKE 'platform.%' OR ae.action LIKE 'newsletter.%')`,
        );
      }
    }

    if (query.entityType) {
      conditions.push(`ae.entity_type = $${pIdx++}`);
      params.push(query.entityType);
    }

    if (query.actorId) {
      conditions.push(`ae.actor_id = $${pIdx++}`);
      params.push(query.actorId);
    }

    if (query.startDate) {
      conditions.push(`ae.created_at >= $${pIdx++}`);
      params.push(query.startDate);
    }
    if (query.endDate) {
      const endVal = query.endDate.length === 10 ? `${query.endDate}T23:59:59.999Z` : query.endDate;
      conditions.push(`ae.created_at <= $${pIdx++}`);
      params.push(endVal);
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(`(
        ae.action ILIKE $${pIdx} OR 
        ae.entity_type ILIKE $${pIdx} OR 
        u.display_name ILIKE $${pIdx} OR 
        u.email ILIKE $${pIdx} OR 
        ae.ip_address::text ILIKE $${pIdx} OR 
        ae.metadata::text ILIKE $${pIdx}
      )`);
      params.push(term);
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Rows older than the cursor; applied to the items query only, so `total`
    // still counts everything the filters match.
    const filterParams = [...params];
    const itemConditions = [...conditions];
    if (cursorId) {
      itemConditions.push(`ae.id < $${pIdx++}`);
      params.push(cursorId);
    }
    const itemsWhere = itemConditions.length > 0 ? `WHERE ${itemConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM audit_events ae
      LEFT JOIN users u ON ae.actor_id = u.id
      ${whereClause};
    `;
    const countRes: Array<{ total?: number | string }> = await this.dataSource.query(
      countSql,
      filterParams,
    );
    const total = Number(countRes[0]?.total ?? 0);

    const itemsSql = `
      SELECT 
        ae.id,
        ae.actor_id AS "actorId",
        ae.actor_type AS "actorType",
        ae.site_id AS "siteId",
        ae.action,
        ae.entity_type AS "entityType",
        ae.entity_id AS "entityId",
        ae.request_id AS "requestId",
        ae.ip_address AS "ipAddress",
        ae.metadata,
        ae.created_at AS "createdAt",
        u.display_name AS "actorName",
        u.email AS "actorEmail",
        s.name AS "siteName",
        s.key AS "siteKey"
      FROM audit_events ae
      LEFT JOIN users u ON ae.actor_id = u.id
      LEFT JOIN sites s ON ae.site_id = s.id
      ${itemsWhere}
      ORDER BY ae.id DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++};
    `;

    // One extra row tells us whether an older page exists.
    const fetched: RawAuditRow[] = await this.dataSource.query(itemsSql, [
      ...params,
      limit + 1,
      offset,
    ]);
    const hasMore = fetched.length > limit;
    const rows = hasMore ? fetched.slice(0, limit) : fetched;
    const lastRow = rows[rows.length - 1];

    const items: AuditLogItem[] = rows.map((r) => {
      const fallbackName =
        r.actorType === 'system'
          ? 'System Service'
          : r.actorType === 'bootstrap'
            ? 'Bootstrap System'
            : null;

      return {
        id: String(r.id),
        actorId: r.actorId ?? null,
        actorType: r.actorType ?? 'user',
        actorName: r.actorName ?? fallbackName,
        actorEmail: r.actorEmail ?? null,
        siteId: r.siteId ?? null,
        siteName: r.siteName ?? null,
        siteKey: r.siteKey ?? null,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId ?? null,
        requestId: r.requestId ?? null,
        ipAddress: r.ipAddress ? String(r.ipAddress) : null,
        metadata: typeof r.metadata === 'object' && r.metadata !== null ? r.metadata : {},
        createdAt: new Date(r.createdAt).toISOString(),
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      nextCursor: hasMore && lastRow ? encodeIdCursor(lastRow.id) : null,
    };
  }

  /**
   * Aggregates activity KPI metrics for the audit log dashboard.
   */
  async getAuditSummary(actor: EffectiveAuthContext, siteId?: string): Promise<AuditLogSummary> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let pIdx = 1;

    if (siteId) {
      if (!actor.isSuperAdmin && !actor.authorizedSiteIds.includes(siteId)) {
        throw new ForbiddenException('Forbidden: insufficient site permissions');
      }
      conditions.push(`ae.site_id = $${pIdx++}`);
      params.push(siteId);
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        conditions.push(`ae.site_id = ANY($${pIdx++})`);
        params.push(actor.authorizedSiteIds);
      } else {
        return {
          totalEvents: 0,
          securityAuthEvents: 0,
          contentEvents: 0,
          systemRoleEvents: 0,
          uniqueActorsCount: 0,
          activeSitesCount: 0,
        };
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const summarySql = `
      SELECT 
        COUNT(*)::int AS "totalEvents",
        COUNT(CASE WHEN ae.action LIKE 'auth.%' THEN 1 END)::int AS "securityAuthEvents",
        COUNT(CASE WHEN ae.action LIKE 'post.%' OR ae.action LIKE 'publication.%' OR ae.action LIKE 'media.%' OR ae.action LIKE 'taxonomy.%' OR ae.action LIKE 'comment.%' THEN 1 END)::int AS "contentEvents",
        COUNT(CASE WHEN ae.action LIKE 'role.%' OR ae.action LIKE 'user.%' OR ae.action LIKE 'site.%' OR ae.action LIKE 'platform.%' OR ae.action LIKE 'newsletter.%' OR ae.actor_type IN ('system', 'bootstrap') THEN 1 END)::int AS "systemRoleEvents",
        COUNT(DISTINCT ae.actor_id)::int AS "uniqueActorsCount",
        COUNT(DISTINCT ae.site_id)::int AS "activeSitesCount"
      FROM audit_events ae
      ${whereClause};
    `;

    const res: RawSummaryRow[] = await this.dataSource.query(summarySql, params);
    const row = res[0] ?? {};

    return {
      totalEvents: Number(row.totalEvents ?? 0),
      securityAuthEvents: Number(row.securityAuthEvents ?? 0),
      contentEvents: Number(row.contentEvents ?? 0),
      systemRoleEvents: Number(row.systemRoleEvents ?? 0),
      uniqueActorsCount: Number(row.uniqueActorsCount ?? 0),
      activeSitesCount: Number(row.activeSitesCount ?? 0),
    };
  }
}
