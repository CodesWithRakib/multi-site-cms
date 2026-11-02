import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  AnalyticsBreakdownItem,
  AnalyticsCountryItem,
  AnalyticsOverviewData,
  AnalyticsRealtimeData,
  AnalyticsSitePerformance,
  AnalyticsSummary,
  AnalyticsTimeseriesPoint,
  AnalyticsTopPage,
} from '@multi-site-cms/types';
import { type DataSource } from 'typeorm';

import {
  AuthorizationService,
  type EffectiveAuthContext,
} from '../auth/services/authorization.service';
import { DATA_SOURCE } from '../database/database.tokens';
import type { AnalyticsQueryDto } from './dto/analytics-query.dto';
import type { RecordPageViewDto } from './dto/record-page-view.dto';

interface RawTimeseriesRow {
  date: string;
  page_views: string | number;
  unique_visitors: string | number;
  avg_duration: string | number;
}

interface RawTopPageRow {
  post_id: string | null;
  path: string;
  title: string | null;
  site_id: string;
  site_name: string;
  page_views: string | number;
  unique_visitors: string | number;
  avg_duration: string | number;
  single_views: string | number;
}

interface RawBreakdownRow {
  key_name: string;
  count: string | number;
}

interface RawCountryRow {
  country_code: string;
  country_name: string;
  count: string | number;
}

interface RawSitePerfRow {
  site_id: string;
  site_name: string;
  site_key: string;
  page_views: string | number;
  unique_visitors: string | number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async getOverview(
    actor: EffectiveAuthContext,
    query: AnalyticsQueryDto,
  ): Promise<AnalyticsOverviewData> {
    const days = this.resolveDays(query);
    let targetSiteId = query.siteId;

    if (targetSiteId) {
      this.authorizationService.assertSiteAccess(actor, targetSiteId);
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        targetSiteId = actor.authorizedSiteIds[0];
      } else {
        return this.getEmptyOverview();
      }
    }

    const [
      summary,
      timeseries,
      topPages,
      deviceBreakdown,
      trafficSources,
      countryBreakdown,
      browserBreakdown,
      sitePerformance,
    ] = await Promise.all([
      this.fetchSummary(targetSiteId, days),
      this.fetchTimeseries(targetSiteId, days),
      this.fetchTopPages(targetSiteId, days),
      this.fetchDeviceBreakdown(targetSiteId, days),
      this.fetchTrafficSources(targetSiteId, days),
      this.fetchCountryBreakdown(targetSiteId, days),
      this.fetchBrowserBreakdown(targetSiteId, days),
      this.fetchSitePerformance(days),
    ]);

    return {
      summary,
      timeseries,
      topPages,
      deviceBreakdown,
      trafficSources,
      countryBreakdown,
      browserBreakdown,
      sitePerformance,
    };
  }

  async getRealtime(
    actor: EffectiveAuthContext,
    siteId?: string,
  ): Promise<AnalyticsRealtimeData> {
    let targetSiteId = siteId;

    if (targetSiteId) {
      this.authorizationService.assertSiteAccess(actor, targetSiteId);
    } else if (!actor.isSuperAdmin) {
      if (actor.authorizedSiteIds.length > 0) {
        targetSiteId = actor.authorizedSiteIds[0];
      } else {
        return {
          activeVisitors30m: 0,
          pageViewsLastHour: 0,
          recentViewsPerMinute: [],
          recentEvents: [],
        };
      }
    }

    const siteClause = targetSiteId ? 'AND pv.site_id = $1' : '';
    const params = targetSiteId ? [targetSiteId] : [];

    // 1. Active distinct visitors in last 30 minutes
    const activeRes = await this.dataSource.query(
      `
      SELECT count(DISTINCT visitor_id)::int AS count
      FROM analytics_page_views pv
      WHERE pv.created_at >= (now() - interval '30 minutes')
      ${siteClause}
    `,
      params,
    );
    const activeVisitors30m = Number(activeRes[0]?.count) || 0;

    // 2. Page views in last 60 minutes
    const hourRes = await this.dataSource.query(
      `
      SELECT count(*)::int AS count
      FROM analytics_page_views pv
      WHERE pv.created_at >= (now() - interval '60 minutes')
      ${siteClause}
    `,
      params,
    );
    const pageViewsLastHour = Number(hourRes[0]?.count) || 0;

    // 3. Views per minute over last 30 minutes
    const minuteQuery = `
      WITH minutes AS (
        SELECT generate_series(
          date_trunc('minute', now() - interval '29 minutes'),
          date_trunc('minute', now()),
          interval '1 minute'
        ) AS m
      ),
      counts AS (
        SELECT 
          date_trunc('minute', created_at) AS m,
          count(*)::int AS views
        FROM analytics_page_views pv
        WHERE created_at >= (now() - interval '30 minutes')
        ${siteClause}
        GROUP BY date_trunc('minute', created_at)
      )
      SELECT 
        to_char(m.m, 'HH24:MI') AS minute,
        COALESCE(c.views, 0)::int AS views
      FROM minutes m
      LEFT JOIN counts c ON m.m = c.m
      ORDER BY m.m ASC;
    `;
    const minuteRows = await this.dataSource.query(minuteQuery, params);
    const recentViewsPerMinute = minuteRows.map((r: { minute: string; views: number }) => ({
      minute: r.minute,
      views: Number(r.views) || 0,
    }));

    // 4. Latest 8 live page view events
    const eventsQuery = `
      SELECT 
        pv.id,
        s.name AS "siteName",
        pv.path,
        pr.title,
        pv.country_name AS "countryName",
        pv.device_type AS "deviceType",
        to_char(pv.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS timestamp
      FROM analytics_page_views pv
      JOIN sites s ON pv.site_id = s.id
      LEFT JOIN post_revisions pr ON pv.post_id = pr.post_id AND pr.id = (
        SELECT id FROM post_revisions WHERE post_id = pv.post_id ORDER BY revision_number DESC LIMIT 1
      )
      WHERE 1=1 ${siteClause}
      ORDER BY pv.created_at DESC
      LIMIT 8;
    `;
    const eventRows = await this.dataSource.query(eventsQuery, params);
    const recentEvents = eventRows.map((r: {
      id: string;
      siteName: string;
      path: string;
      title: string | null;
      countryName: string;
      deviceType: string;
      timestamp: string;
    }) => ({
      id: r.id,
      siteName: r.siteName,
      path: r.path,
      title: r.title ?? undefined,
      countryName: r.countryName,
      deviceType: r.deviceType,
      timestamp: r.timestamp,
    }));

    return {
      activeVisitors30m,
      pageViewsLastHour,
      recentViewsPerMinute,
      recentEvents,
    };
  }

  async recordPageView(
    dto: RecordPageViewDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; id: string }> {
    const rawIp = ipAddress || '127.0.0.1';
    const rawUa = userAgent || 'Mozilla/5.0';
    const visitorId =
      dto.visitorId ||
      createHash('sha256').update(`${rawIp}:${rawUa}:${new Date().toISOString().slice(0, 10)}`).digest('hex').slice(0, 32);

    const device = this.detectDevice(rawUa);
    const browser = this.detectBrowser(rawUa);
    const os = this.detectOs(rawUa);
    const source = this.detectReferrerSource(dto.referrer);
    const duration = dto.durationSeconds ?? Math.floor(20 + Math.random() * 120);

    const insertRes = await this.dataSource.query(
      `
      INSERT INTO analytics_page_views (
        site_id, post_id, path, referrer, referrer_source,
        visitor_id, device_type, browser, os,
        country_code, country_name, duration_seconds, is_unique, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, now())
      RETURNING id;
    `,
      [
        dto.siteId,
        dto.postId || null,
        dto.path,
        dto.referrer || null,
        source,
        visitorId,
        device,
        browser,
        os,
        'US',
        'United States',
        duration,
      ],
    );

    return { success: true, id: insertRes[0]?.id };
  }

  private resolveDays(query: AnalyticsQueryDto): number {
    if (query.timeframe) {
      switch (query.timeframe) {
        case '7d':
          return 7;
        case '14d':
          return 14;
        case '30d':
          return 30;
        case '90d':
          return 90;
        case '1y':
          return 365;
      }
    }
    return query.days || 30;
  }

  private async fetchSummary(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsSummary> {
    const siteClause = targetSiteId ? 'AND site_id = $2' : '';
    const paramsCurrent: unknown[] = [days];
    const paramsPrevious: unknown[] = [days];
    if (targetSiteId) {
      paramsCurrent.push(targetSiteId);
      paramsPrevious.push(targetSiteId);
    }

    const currentQuery = `
      SELECT 
        count(*)::int AS total_views,
        count(DISTINCT visitor_id)::int AS unique_visitors,
        COALESCE(avg(duration_seconds), 0)::int AS avg_duration,
        COALESCE(
          (count(*) FILTER (WHERE duration_seconds < 15)::numeric / NULLIF(count(*), 0) * 100),
          0
        )::numeric(5,1) AS bounce_rate
      FROM analytics_page_views
      WHERE created_at >= (now() - ($1 || ' days')::interval)
      ${siteClause};
    `;

    const previousQuery = `
      SELECT 
        count(*)::int AS total_views,
        count(DISTINCT visitor_id)::int AS unique_visitors,
        COALESCE(avg(duration_seconds), 0)::int AS avg_duration,
        COALESCE(
          (count(*) FILTER (WHERE duration_seconds < 15)::numeric / NULLIF(count(*), 0) * 100),
          0
        )::numeric(5,1) AS bounce_rate
      FROM analytics_page_views
      WHERE created_at >= (now() - ($1 * 2 || ' days')::interval)
        AND created_at < (now() - ($1 || ' days')::interval)
      ${siteClause};
    `;

    const [currentRows, previousRows] = await Promise.all([
      this.dataSource.query(currentQuery, paramsCurrent),
      this.dataSource.query(previousQuery, paramsPrevious),
    ]);

    const cur = currentRows[0] || {};
    const prev = previousRows[0] || {};

    const totalPageViews = Number(cur.total_views) || 0;
    const prevViews = Number(prev.total_views) || 0;
    const pageViewsGrowth = this.calculateGrowth(totalPageViews, prevViews);

    const uniqueVisitors = Number(cur.unique_visitors) || 0;
    const prevVisitors = Number(prev.unique_visitors) || 0;
    const visitorsGrowth = this.calculateGrowth(uniqueVisitors, prevVisitors);

    const avgDurationSeconds = Number(cur.avg_duration) || 0;
    const prevDuration = Number(prev.avg_duration) || 0;
    const durationGrowth = this.calculateGrowth(avgDurationSeconds, prevDuration);

    const bounceRate = Number(cur.bounce_rate) || 0;
    const prevBounce = Number(prev.bounce_rate) || 0;
    const bounceRateGrowth = Number((bounceRate - prevBounce).toFixed(1));

    return {
      totalPageViews,
      pageViewsGrowth,
      uniqueVisitors,
      visitorsGrowth,
      avgDurationSeconds,
      durationGrowth,
      bounceRate,
      bounceRateGrowth,
    };
  }

  private async fetchTimeseries(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsTimeseriesPoint[]> {
    const siteClause = targetSiteId ? 'AND site_id = $2' : '';
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
      stats AS (
        SELECT 
          date_trunc('day', created_at)::date AS day,
          count(*)::int AS page_views,
          count(DISTINCT visitor_id)::int AS unique_visitors,
          COALESCE(avg(duration_seconds), 0)::int AS avg_duration
        FROM analytics_page_views
        WHERE created_at >= (CURRENT_DATE - ($1 || ' days')::interval)::date
        ${siteClause}
        GROUP BY date_trunc('day', created_at)::date
      )
      SELECT 
        to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(s.page_views, 0)::int AS page_views,
        COALESCE(s.unique_visitors, 0)::int AS unique_visitors,
        COALESCE(s.avg_duration, 0)::int AS avg_duration
      FROM dates d
      LEFT JOIN stats s ON d.day = s.day
      ORDER BY d.day ASC;
    `;

    const rows: RawTimeseriesRow[] = await this.dataSource.query(query, params);
    return rows.map((r) => ({
      date: r.date,
      pageViews: Number(r.page_views) || 0,
      uniqueVisitors: Number(r.unique_visitors) || 0,
      avgDurationSeconds: Number(r.avg_duration) || 0,
    }));
  }

  private async fetchTopPages(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsTopPage[]> {
    const siteClause = targetSiteId ? 'AND pv.site_id = $2' : '';
    const params: unknown[] = [days];
    if (targetSiteId) {
      params.push(targetSiteId);
    }

    const query = `
      SELECT 
        pv.post_id,
        pv.path,
        pr.title,
        pv.site_id,
        s.name AS site_name,
        count(*)::int AS page_views,
        count(DISTINCT pv.visitor_id)::int AS unique_visitors,
        COALESCE(avg(pv.duration_seconds), 0)::int AS avg_duration,
        count(*) FILTER (WHERE pv.duration_seconds < 15)::int AS single_views
      FROM analytics_page_views pv
      JOIN sites s ON pv.site_id = s.id
      LEFT JOIN post_revisions pr ON pv.post_id = pr.post_id AND pr.id = (
        SELECT id FROM post_revisions WHERE post_id = pv.post_id ORDER BY revision_number DESC LIMIT 1
      )
      WHERE pv.created_at >= (now() - ($1 || ' days')::interval)
      ${siteClause}
      GROUP BY pv.post_id, pv.path, pr.title, pv.site_id, s.name
      ORDER BY page_views DESC
      LIMIT 10;
    `;

    const rows: RawTopPageRow[] = await this.dataSource.query(query, params);
    return rows.map((r) => {
      const views = Number(r.page_views) || 0;
      const singles = Number(r.single_views) || 0;
      const bounce = views > 0 ? Number(((singles / views) * 100).toFixed(1)) : 0;
      return {
        postId: r.post_id,
        slug: r.path,
        title: r.title || (r.path === '/' ? 'Home Page' : r.path.replace('/', '').replace(/-/g, ' ')),
        siteId: r.site_id,
        siteName: r.site_name,
        pageViews: views,
        uniqueVisitors: Number(r.unique_visitors) || 0,
        avgDurationSeconds: Number(r.avg_duration) || 0,
        bounceRate: bounce,
      };
    });
  }

  private async fetchDeviceBreakdown(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsBreakdownItem[]> {
    return this.fetchGenericBreakdown('device_type', targetSiteId, days, {
      desktop: 'Desktop',
      mobile: 'Mobile',
      tablet: 'Tablet',
    });
  }

  private async fetchTrafficSources(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsBreakdownItem[]> {
    return this.fetchGenericBreakdown('referrer_source', targetSiteId, days, {
      search: 'Organic Search',
      direct: 'Direct Traffic',
      social: 'Social Networks',
      newsletter: 'Email Campaigns',
      referral: 'Referral Links',
    });
  }

  private async fetchBrowserBreakdown(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsBreakdownItem[]> {
    return this.fetchGenericBreakdown('browser', targetSiteId, days, {
      chrome: 'Google Chrome',
      safari: 'Apple Safari',
      firefox: 'Mozilla Firefox',
      edge: 'Microsoft Edge',
      other: 'Other Browsers',
    });
  }

  private async fetchCountryBreakdown(
    targetSiteId: string | undefined,
    days: number,
  ): Promise<AnalyticsCountryItem[]> {
    const siteClause = targetSiteId ? 'AND site_id = $2' : '';
    const params: unknown[] = [days];
    if (targetSiteId) params.push(targetSiteId);

    const query = `
      SELECT 
        country_code,
        country_name,
        count(*)::int AS count
      FROM analytics_page_views
      WHERE created_at >= (now() - ($1 || ' days')::interval)
      ${siteClause}
      GROUP BY country_code, country_name
      ORDER BY count DESC
      LIMIT 8;
    `;

    const rows: RawCountryRow[] = await this.dataSource.query(query, params);
    const total = rows.reduce((acc, r) => acc + (Number(r.count) || 0), 0);

    return rows.map((r) => ({
      countryCode: r.country_code,
      countryName: r.country_name,
      count: Number(r.count) || 0,
      percentage: total > 0 ? Number((((Number(r.count) || 0) / total) * 100).toFixed(1)) : 0,
    }));
  }

  private async fetchSitePerformance(days: number): Promise<AnalyticsSitePerformance[]> {
    const query = `
      SELECT 
        s.id AS site_id,
        s.name AS site_name,
        s.key AS site_key,
        count(pv.id)::int AS page_views,
        count(DISTINCT pv.visitor_id)::int AS unique_visitors
      FROM sites s
      LEFT JOIN analytics_page_views pv ON s.id = pv.site_id AND pv.created_at >= (now() - ($1 || ' days')::interval)
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.key
      ORDER BY page_views DESC;
    `;

    const rows: RawSitePerfRow[] = await this.dataSource.query(query, [days]);
    const totalViews = rows.reduce((acc, r) => acc + (Number(r.page_views) || 0), 0);

    return rows.map((r) => ({
      siteId: r.site_id,
      siteName: r.site_name,
      siteKey: r.site_key,
      pageViews: Number(r.page_views) || 0,
      uniqueVisitors: Number(r.unique_visitors) || 0,
      percentage: totalViews > 0 ? Number((((Number(r.page_views) || 0) / totalViews) * 100).toFixed(1)) : 0,
    }));
  }

  private async fetchGenericBreakdown(
    columnName: 'device_type' | 'referrer_source' | 'browser',
    targetSiteId: string | undefined,
    days: number,
    labels: Record<string, string>,
  ): Promise<AnalyticsBreakdownItem[]> {
    const siteClause = targetSiteId ? 'AND site_id = $2' : '';
    const params: unknown[] = [days];
    if (targetSiteId) params.push(targetSiteId);

    const query = `
      SELECT 
        ${columnName} AS key_name,
        count(*)::int AS count
      FROM analytics_page_views
      WHERE created_at >= (now() - ($1 || ' days')::interval)
      ${siteClause}
      GROUP BY ${columnName}
      ORDER BY count DESC;
    `;

    const rows: RawBreakdownRow[] = await this.dataSource.query(query, params);
    const total = rows.reduce((acc, r) => acc + (Number(r.count) || 0), 0);

    return rows.map((r) => {
      const key = String(r.key_name).toLowerCase();
      const count = Number(r.count) || 0;
      return {
        key,
        label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1),
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      };
    });
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private detectDevice(ua: string): string {
    const lower = ua.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(lower)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobile|blackberry|phone/i.test(lower)) return 'mobile';
    return 'desktop';
  }

  private detectBrowser(ua: string): string {
    const lower = ua.toLowerCase();
    if (/edg\//i.test(lower)) return 'edge';
    if (/chrome|crios/i.test(lower) && !/opr|opera/i.test(lower)) return 'chrome';
    if (/safari/i.test(lower) && !/chrome|crios/i.test(lower)) return 'safari';
    if (/firefox|fxios/i.test(lower)) return 'firefox';
    return 'other';
  }

  private detectOs(ua: string): string {
    const lower = ua.toLowerCase();
    if (/windows/i.test(lower)) return 'windows';
    if (/macintosh|mac os x/i.test(lower)) return 'macos';
    if (/iphone|ipad|ipod/i.test(lower)) return 'ios';
    if (/android/i.test(lower)) return 'android';
    if (/linux/i.test(lower)) return 'linux';
    return 'other';
  }

  private detectReferrerSource(referrer?: string): string {
    if (!referrer) return 'direct';
    const lower = referrer.toLowerCase();
    if (/google|bing|duckduckgo|yahoo|yandex|baidu/i.test(lower)) return 'search';
    if (/twitter|t\.co|x\.com|facebook|instagram|linkedin|reddit|pinterest/i.test(lower)) return 'social';
    if (/mail|newsletter|campaign|substack/i.test(lower)) return 'newsletter';
    return 'referral';
  }

  private getEmptyOverview(): AnalyticsOverviewData {
    return {
      summary: {
        totalPageViews: 0,
        pageViewsGrowth: 0,
        uniqueVisitors: 0,
        visitorsGrowth: 0,
        avgDurationSeconds: 0,
        durationGrowth: 0,
        bounceRate: 0,
        bounceRateGrowth: 0,
      },
      timeseries: [],
      topPages: [],
      deviceBreakdown: [],
      trafficSources: [],
      countryBreakdown: [],
      browserBreakdown: [],
      sitePerformance: [],
    };
  }
}

