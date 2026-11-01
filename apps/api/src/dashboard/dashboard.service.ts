import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  DashboardActivityDataPoint,
  DashboardMetrics,
  DashboardOverviewData,
  DashboardRecentActivityItem,
  DashboardRecentContentItem,
} from '@multi-site-cms/types';
import { type DataSource } from 'typeorm';

import {
  AuthorizationService,
  type EffectiveAuthContext,
} from '../auth/services/authorization.service';
import { DATA_SOURCE } from '../database/database.tokens';
import type { DashboardQueryDto } from './dto/dashboard-query.dto';

interface StatusCountRow {
  status: string;
  count: string;
}

interface RawActivitySeriesRow {
  date: string;
  published: string | number;
  drafts: string | number;
  scheduled: string | number;
}

interface RawRecentContentRow {
  id: string;
  postId: string;
  slug: string;
  status: string;
  siteId: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  title: string;
  type: string;
  siteName: string;
  siteKey: string;
}

interface RawAuditEventRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorId: string | null;
  siteId: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  actorEmail: string | null;
  siteName: string | null;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getOverview(
    actor: EffectiveAuthContext,
    query: DashboardQueryDto,
  ): Promise<DashboardOverviewData> {
    const days = query.days && [7, 14, 30, 90].includes(query.days) ? query.days : 30;

    let targetSiteId: string | undefined = query.siteId;

    if (targetSiteId) {
      this.authorizationService.assertSiteAccess(actor, targetSiteId);
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        targetSiteId = actor.authorizedSiteIds[0];
      } else {
        return this.getEmptyOverview();
      }
    }

    const [metrics, activitySeries, recentContent, recentActivity] = await Promise.all([
      this.fetchMetrics(actor, targetSiteId),
      this.fetchActivitySeries(targetSiteId, days),
      this.fetchRecentContent(actor, targetSiteId),
      this.fetchRecentActivity(actor, targetSiteId),
    ]);

    return {
      metrics,
      activitySeries,
      recentContent,
      recentActivity,
    };
  }

  private async fetchMetrics(
    actor: EffectiveAuthContext,
    targetSiteId?: string,
  ): Promise<DashboardMetrics> {
    let totalContent = 0;
    let publishedCount = 0;
    let draftsCount = 0;
    let scheduledCount = 0;
    let archivedCount = 0;
    let activeSitesCount = 0;

    if (targetSiteId) {
      const totalRes = await this.dataSource.query(
        `SELECT count(DISTINCT post_id)::int as count FROM post_publications WHERE site_id = $1`,
        [targetSiteId],
      );
      totalContent = totalRes[0]?.count ?? 0;

      const statusRes: StatusCountRow[] = await this.dataSource.query(
        `SELECT status, count(*)::text as count FROM post_publications WHERE site_id = $1 GROUP BY status`,
        [targetSiteId],
      );
      for (const row of statusRes) {
        const c = Number.parseInt(row.count, 10) || 0;
        if (row.status === 'published') publishedCount += c;
        else if (row.status === 'draft' || row.status === 'in_review') draftsCount += c;
        else if (row.status === 'scheduled') scheduledCount += c;
        else if (row.status === 'archived') archivedCount += c;
      }

      activeSitesCount = 1;
    } else {
      const totalRes = await this.dataSource.query(
        `SELECT count(*)::int as count FROM posts WHERE deleted_at IS NULL`,
      );
      totalContent = totalRes[0]?.count ?? 0;

      const statusRes: StatusCountRow[] = await this.dataSource.query(
        `SELECT status, count(*)::text as count FROM post_publications GROUP BY status`,
      );
      for (const row of statusRes) {
        const c = Number.parseInt(row.count, 10) || 0;
        if (row.status === 'published') publishedCount += c;
        else if (row.status === 'draft' || row.status === 'in_review') draftsCount += c;
        else if (row.status === 'scheduled') scheduledCount += c;
        else if (row.status === 'archived') archivedCount += c;
      }

      const sitesRes = await this.dataSource.query(
        `SELECT count(*)::int as count FROM sites WHERE status = 'active'`,
      );
      activeSitesCount = sitesRes[0]?.count ?? 0;
    }

    return {
      totalContent,
      publishedCount,
      draftsCount,
      scheduledCount,
      archivedCount,
      activeSitesCount,
    };
  }

  private async fetchActivitySeries(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<DashboardActivityDataPoint[]> {
    const siteClause = targetSiteId ? `AND site_id = $2` : '';
    const params: unknown[] = [days - 1];
    if (targetSiteId) {
      params.push(targetSiteId);
    }

    const query = `
      WITH dates AS (
        SELECT generate_series(
          (CURRENT_DATE - ($1 || ' days')::interval)::date,
          CURRENT_DATE,
          '1 day'::interval
        )::date AS day
      ),
      pub_stats AS (
        SELECT 
          date_trunc('day', created_at)::date AS day,
          count(*) FILTER (WHERE status = 'published')::int AS published,
          count(*) FILTER (WHERE status IN ('draft', 'in_review'))::int AS drafts,
          count(*) FILTER (WHERE status = 'scheduled')::int AS scheduled
        FROM post_publications
        WHERE created_at >= (CURRENT_DATE - ($1 || ' days')::interval)::date
        ${siteClause}
        GROUP BY date_trunc('day', created_at)::date
      )
      SELECT 
        to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(p.published, 0)::int AS published,
        COALESCE(p.drafts, 0)::int AS drafts,
        COALESCE(p.scheduled, 0)::int AS scheduled
      FROM dates d
      LEFT JOIN pub_stats p ON d.day = p.day
      ORDER BY d.day ASC;
    `;

    const rows: RawActivitySeriesRow[] = await this.dataSource.query(query, params);

    return rows.map((r) => ({
      date: r.date,
      published: Number(r.published) || 0,
      drafts: Number(r.drafts) || 0,
      scheduled: Number(r.scheduled) || 0,
    }));
  }

  private async fetchRecentContent(
    _actor: EffectiveAuthContext,
    targetSiteId?: string,
  ): Promise<DashboardRecentContentItem[]> {
    const siteClause = targetSiteId ? `AND pp.site_id = $1` : '';
    const params: unknown[] = targetSiteId ? [targetSiteId] : [];

    const query = `
      SELECT 
        pp.id,
        pp.post_id AS "postId",
        pp.slug,
        pp.status,
        pp.site_id AS "siteId",
        pp.updated_at AS "updatedAt",
        pp.published_at AS "publishedAt",
        pp.scheduled_for AS "scheduledFor",
        pr.title,
        p.type,
        s.name AS "siteName",
        s.key AS "siteKey"
      FROM post_publications pp
      JOIN post_revisions pr ON pp.revision_id = pr.id
      JOIN posts p ON pp.post_id = p.id
      JOIN sites s ON pp.site_id = s.id
      WHERE p.deleted_at IS NULL
      ${siteClause}
      ORDER BY pp.updated_at DESC
      LIMIT 8;
    `;

    const rows: RawRecentContentRow[] = await this.dataSource.query(query, params);

    return rows.map((r) => ({
      id: r.id,
      postId: r.postId,
      title: r.title,
      slug: r.slug,
      type: r.type,
      status: r.status,
      siteId: r.siteId,
      siteName: r.siteName,
      siteKey: r.siteKey,
      updatedAt: r.updatedAt,
      publishedAt: r.publishedAt,
      scheduledFor: r.scheduledFor,
    }));
  }

  private async fetchRecentActivity(
    actor: EffectiveAuthContext,
    targetSiteId?: string,
  ): Promise<DashboardRecentActivityItem[]> {
    const params: unknown[] = [];
    let whereClause = '';

    if (targetSiteId) {
      params.push(targetSiteId);
      whereClause = 'WHERE ae.site_id = $1';
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        whereClause = `WHERE ae.site_id = ANY($1)`;
        params.push(actor.authorizedSiteIds);
      } else {
        return [];
      }
    }

    const query = `
      SELECT 
        ae.id,
        ae.action,
        ae.entity_type AS "entityType",
        ae.entity_id AS "entityId",
        ae.actor_id AS "actorId",
        ae.site_id AS "siteId",
        ae.created_at AS "createdAt",
        ae.metadata,
        u.display_name AS "actorName",
        u.email AS "actorEmail",
        s.name AS "siteName"
      FROM audit_events ae
      LEFT JOIN users u ON ae.actor_id = u.id
      LEFT JOIN sites s ON ae.site_id = s.id
      ${whereClause}
      ORDER BY ae.id DESC
      LIMIT 8;
    `;

    const rows: RawAuditEventRow[] = await this.dataSource.query(query, params);

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      actorId: r.actorId,
      actorName: r.actorName || (r.actorId ? 'CMS User' : 'System Event'),
      actorEmail: r.actorEmail,
      siteId: r.siteId,
      siteName: r.siteName,
      createdAt: r.createdAt,
      summary: this.generateActivitySummary(r),
    }));
  }

  private generateActivitySummary(event: RawAuditEventRow): string {
    const metaTitle = (event.metadata?.title as string) || '';
    const metaSlug = (event.metadata?.slug as string) || '';
    const subject =
      metaTitle || metaSlug ? `"${metaTitle || metaSlug}"` : event.entityType || 'item';
    const action = event.action || 'system.event';

    switch (action) {
      case 'post.create':
        return `Created new content ${subject}`;
      case 'post.update':
        return `Updated content draft ${subject}`;
      case 'publication.publish':
        return `Published ${subject} to ${event.siteName || 'target site'}`;
      case 'publication.schedule':
        return `Scheduled publication of ${subject}`;
      case 'publication.archive':
        return `Archived publication ${subject}`;
      case 'auth.login':
        return `Logged in to administrative workspace`;
      case 'auth.bootstrap':
        return `Initialized super admin credentials`;
      case 'media.upload':
        return `Uploaded media asset ${subject}`;
      case 'site.update':
        return `Updated site configuration for ${event.siteName || subject}`;
      default:
        return `${action.replace('.', ' ')}: ${subject}`;
    }
  }

  private getEmptyOverview(): DashboardOverviewData {
    return {
      metrics: {
        totalContent: 0,
        publishedCount: 0,
        draftsCount: 0,
        scheduledCount: 0,
        archivedCount: 0,
        activeSitesCount: 0,
      },
      activitySeries: [],
      recentContent: [],
      recentActivity: [],
    };
  }
}
