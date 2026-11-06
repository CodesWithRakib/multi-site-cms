import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { DataSource } from 'typeorm';

import type { UserRoleSummary } from '@multi-site-cms/types';

import { DashboardService } from '../../src/dashboard/dashboard.service';
import type {
  AuthorizationService,
  EffectiveAuthContext,
} from '../../src/auth/services/authorization.service';
import type { User } from '../../src/database/entities/user.entity';

describe('DashboardService', () => {
  const mockAuthorizationService = {
    assertSiteAccess: jest.fn(),
    canAccessSite: jest.fn(),
  };

  const mockQuery = jest.fn();
  const mockDataSource = {
    isInitialized: true,
    query: mockQuery,
  } as unknown as DataSource;

  const service = new DashboardService(
    mockDataSource,
    mockAuthorizationService as unknown as AuthorizationService,
  );

  const mockSuperAdmin: EffectiveAuthContext = {
    user: {
      id: 'user-super-admin',
      email: 'admin@example.com',
      displayName: 'Super Admin',
    } as User,
    isSuperAdmin: true,
    roles: [{ roleKey: 'super_admin', scopeType: 'platform' } as unknown as UserRoleSummary],
    permissions: ['post:read', 'post:create'],
    authorizedSiteIds: ['site-travel', 'site-airsports'],
    sitePermissions: {},
  };

  const mockClientAdmin: EffectiveAuthContext = {
    user: {
      id: 'user-client-admin',
      email: 'travel@example.com',
      displayName: 'Travel Admin',
    } as User,
    isSuperAdmin: false,
    roles: [
      { roleKey: 'admin', scopeType: 'site', siteId: 'site-travel' } as unknown as UserRoleSummary,
    ],
    permissions: ['post:read'],
    authorizedSiteIds: ['site-travel'],
    sitePermissions: { 'site-travel': ['post:read'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asserts site access when siteId is explicitly provided in query', async () => {
    mockAuthorizationService.assertSiteAccess.mockImplementationOnce(() => {});

    mockQuery.mockImplementation((sql: unknown) => {
      if (typeof sql !== 'string') return Promise.resolve([]);
      if (sql.includes('count(DISTINCT post_id)')) return Promise.resolve([{ count: 5 }]);
      if (sql.includes('GROUP BY status')) {
        return Promise.resolve([
          { status: 'published', count: '3' },
          { status: 'draft', count: '2' },
        ]);
      }
      if (sql.includes('pub_stats AS')) {
        return Promise.resolve([{ date: '2026-11-01', published: 1, drafts: 1, scheduled: 0 }]);
      }
      if (sql.includes('FROM post_publications pp')) {
        return Promise.resolve([
          {
            id: 'pub-1',
            postId: 'post-1',
            slug: 'test-article',
            status: 'published',
            siteId: 'site-travel',
            updatedAt: '2026-11-01T12:00:00Z',
            publishedAt: '2026-11-01T12:00:00Z',
            scheduledFor: null,
            title: 'Test Article',
            type: 'article',
            siteName: 'Travel Blog',
            siteKey: 'travel-blog',
          },
        ]);
      }
      if (sql.includes('FROM audit_events ae')) {
        return Promise.resolve([
          {
            id: '1',
            action: 'publication.publish',
            entityType: 'post_publication',
            entityId: 'pub-1',
            actorId: 'user-super-admin',
            siteId: 'site-travel',
            createdAt: '2026-11-01T12:00:00Z',
            metadata: { title: 'Test Article' },
            actorName: 'Super Admin',
            actorEmail: 'admin@example.com',
            siteName: 'Travel Blog',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await service.getOverview(mockSuperAdmin, { siteId: 'site-travel', days: 7 });

    expect(mockAuthorizationService.assertSiteAccess).toHaveBeenCalledWith(
      mockSuperAdmin,
      'site-travel',
    );
    expect(result.metrics.totalContent).toBe(5);
    expect(result.metrics.publishedCount).toBe(3);
    expect(result.metrics.draftsCount).toBe(2);
    expect(result.metrics.activeSitesCount).toBe(1);
    expect(result.activitySeries).toHaveLength(1);
    expect(result.recentContent).toHaveLength(1);
    expect(result.recentContent[0]?.title).toBe('Test Article');
    expect(result.recentActivity).toHaveLength(1);
    expect(result.recentActivity[0]?.summary).toContain('Published "Test Article"');
  });

  it('summarizes sign-out, profile photo and unknown actions without leaking raw action codes', async () => {
    const row = (id: string, action: string, metadata: Record<string, unknown> = {}) => ({
      id,
      action,
      entityType: 'user',
      entityId: null,
      actorId: 'user-super-admin',
      siteId: null,
      createdAt: '2026-11-01T12:00:00Z',
      metadata,
      actorName: 'Super Admin',
      actorEmail: 'admin@example.com',
      siteName: null,
    });

    mockQuery.mockImplementation((sql: unknown) => {
      if (typeof sql === 'string' && sql.includes('FROM audit_events ae')) {
        return Promise.resolve([
          row('1', 'auth.logout'),
          row('2', 'user.avatar_update'),
          row('3', 'billing.invoice_paid'),
          row('4', 'billing.invoice_paid', { title: 'INV-7' }),
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await service.getOverview(mockSuperAdmin, { days: 7 });
    const summaries = result.recentActivity.map((event) => event.summary);

    expect(summaries).toEqual([
      'Signed out of the administrative workspace',
      'Updated a profile photo',
      'Billing invoice paid',
      'Billing invoice paid: "INV-7"',
    ]);
  });

  it('restricts client admin without siteId to their authorized site', async () => {
    mockQuery.mockImplementation((sql: unknown) => {
      if (typeof sql !== 'string') return Promise.resolve([]);
      if (sql.includes('count(DISTINCT post_id)')) return Promise.resolve([{ count: 2 }]);
      if (sql.includes('GROUP BY status')) {
        return Promise.resolve([{ status: 'published', count: '2' }]);
      }
      return Promise.resolve([]);
    });

    const result = await service.getOverview(mockClientAdmin, {});

    expect(result.metrics.totalContent).toBe(2);
    expect(result.metrics.publishedCount).toBe(2);
    expect(result.metrics.activeSitesCount).toBe(1);
  });

  it('returns empty overview for client admin with 0 authorized sites', async () => {
    const unauthorizedUser: EffectiveAuthContext = {
      ...mockClientAdmin,
      authorizedSiteIds: [],
    };

    const result = await service.getOverview(unauthorizedUser, {});

    expect(result.metrics.totalContent).toBe(0);
    expect(result.metrics.publishedCount).toBe(0);
    expect(result.activitySeries).toHaveLength(0);
    expect(result.recentContent).toHaveLength(0);
    expect(result.recentActivity).toHaveLength(0);
  });

  it('generates platform-wide metrics for Super Admin when siteId is omitted', async () => {
    mockQuery.mockImplementation((sql: unknown) => {
      if (typeof sql !== 'string') return Promise.resolve([]);
      if (sql.includes('FROM posts WHERE deleted_at IS NULL'))
        return Promise.resolve([{ count: 12 }]);
      if (sql.includes('GROUP BY status')) {
        return Promise.resolve([
          { status: 'published', count: '8' },
          { status: 'draft', count: '3' },
          { status: 'scheduled', count: '1' },
        ]);
      }
      if (sql.includes('FROM sites WHERE status')) return Promise.resolve([{ count: 2 }]);
      return Promise.resolve([]);
    });

    const result = await service.getOverview(mockSuperAdmin, { days: 30 });

    expect(result.metrics.totalContent).toBe(12);
    expect(result.metrics.publishedCount).toBe(8);
    expect(result.metrics.draftsCount).toBe(3);
    expect(result.metrics.scheduledCount).toBe(1);
    expect(result.metrics.activeSitesCount).toBe(2);
  });
});
