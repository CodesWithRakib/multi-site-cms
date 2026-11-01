import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { ApiErrorResponse, ApiSuccess, DashboardOverviewData } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { Permission } from '../../src/database/entities/permission.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Dashboard Overview API (E2E & RBAC Isolation)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let superAdminCookie: string[];
  let travelAdminCookie: string[];
  let superAdminCsrf: string;
  let travelAdminCsrf: string;

  const defaultPassword = 'SecurePassword123!';

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) {
      return [];
    }
    return Array.isArray(header) ? header : [header];
  }

  function extractCookieValue(cookies: string[], name: string): string {
    const raw = cookies.find((c) => c.startsWith(`${name}=`));
    if (!raw) return '';
    const match = raw.match(new RegExp(`^${name}=([^;]+)`));
    return match && match[1] ? match[1] : '';
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    // 1. Seed Permissions
    const permRepo = dataSource.getRepository(Permission);
    const permissions = await permRepo.save([
      { key: 'post:read', description: 'Read posts and dashboard' },
      { key: 'site:read', description: 'Read site config' },
    ]);

    // 2. Seed Roles
    const roleRepo = dataSource.getRepository(Role);
    const superAdminRole = await roleRepo.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });
    const adminRole = await roleRepo.save({
      key: 'admin',
      name: 'Admin',
      scopeType: 'site',
    });

    // 3. Link permissions
    const rpRepo = dataSource.getRepository(RolePermission);
    for (const p of permissions) {
      await rpRepo.save({ roleId: superAdminRole.id, permissionId: p.id });
      await rpRepo.save({ roleId: adminRole.id, permissionId: p.id });
    }

    // 4. Create sites
    const siteRepo = dataSource.getRepository(Site);
    const travelSite = await siteRepo.save({
      key: 'travel-blog',
      name: 'Travel Blog',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteTravelId = travelSite.id;

    const airSportsSite = await siteRepo.save({
      key: 'air-sports',
      name: 'Air Sports Live',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteAirSportsId = airSportsSite.id;

    // 5. Create users
    const userRepo = dataSource.getRepository(User);
    const superAdmin = await userRepo.save({
      email: 'superadmin@example.com',
      passwordHash: await passwordService.hash(defaultPassword),
      displayName: 'Super Admin',
      status: 'active',
    });

    const travelAdmin = await userRepo.save({
      email: 'traveladmin@example.com',
      passwordHash: await passwordService.hash(defaultPassword),
      displayName: 'Travel Admin',
      status: 'active',
    });

    // 6. Assign roles
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    await uraRepo.save({
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    await uraRepo.save({
      userId: travelAdmin.id,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    // 7. Boot Nest app
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    // 8. Log in Super Admin
    const superCsrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
    const superCsrfCookies = extractSetCookies(superCsrfRes);
    superAdminCsrf = superCsrfRes.body.data.csrfToken;

    const superLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Cookie', superCsrfCookies)
      .set('x-csrf-token', superAdminCsrf)
      .send({ email: 'superadmin@example.com', password: defaultPassword });

    superAdminCookie = [
      ...extractSetCookies(superLoginRes),
      `multi_site_cms_csrf=${extractCookieValue(superCsrfCookies, 'multi_site_cms_csrf')}`,
    ];

    // 9. Log in Travel Admin
    const travelCsrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
    const travelCsrfCookies = extractSetCookies(travelCsrfRes);
    travelAdminCsrf = travelCsrfRes.body.data.csrfToken;

    const travelLoginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Cookie', travelCsrfCookies)
      .set('x-csrf-token', travelAdminCsrf)
      .send({ email: 'traveladmin@example.com', password: defaultPassword });

    travelAdminCookie = [
      ...extractSetCookies(travelLoginRes),
      `multi_site_cms_csrf=${extractCookieValue(travelCsrfCookies, 'multi_site_cms_csrf')}`,
    ];
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('rejects unauthenticated request to /dashboard/overview with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/dashboard/overview').expect(401);

    expect((res.body as ApiErrorResponse).error.code).toBe('UNAUTHENTICATED');
  });

  it('allows Super Admin to view platform-wide dashboard overview', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/overview?days=30')
      .set('Cookie', superAdminCookie)
      .expect(200);

    const data: DashboardOverviewData = (res.body as ApiSuccess<DashboardOverviewData>).data;
    expect(data).toBeDefined();
    expect(data.metrics).toBeDefined();
    expect(typeof data.metrics.totalContent).toBe('number');
    expect(typeof data.metrics.publishedCount).toBe('number');
    expect(typeof data.metrics.draftsCount).toBe('number');
    expect(typeof data.metrics.scheduledCount).toBe('number');
    expect(data.metrics.activeSitesCount).toBe(2);
    expect(Array.isArray(data.activitySeries)).toBe(true);
    expect(data.activitySeries.length).toBeGreaterThan(0);
    expect(Array.isArray(data.recentContent)).toBe(true);
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });

  it('allows Super Admin to filter dashboard overview by specific site', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/dashboard/overview?siteId=${siteTravelId}&days=7`)
      .set('Cookie', superAdminCookie)
      .expect(200);

    const data: DashboardOverviewData = (res.body as ApiSuccess<DashboardOverviewData>).data;
    expect(data).toBeDefined();
    expect(data.metrics.activeSitesCount).toBe(1);
    expect(data.activitySeries.length).toBe(7);
  });

  it('allows Site Admin to view their authorized site dashboard overview', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/dashboard/overview?siteId=${siteTravelId}`)
      .set('Cookie', travelAdminCookie)
      .expect(200);

    const data: DashboardOverviewData = (res.body as ApiSuccess<DashboardOverviewData>).data;
    expect(data).toBeDefined();
    expect(data.metrics.activeSitesCount).toBe(1);
  });

  it('rejects Site Admin trying to view an unauthorized site with 404 (anti-enumeration)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/dashboard/overview?siteId=${siteAirSportsId}`)
      .set('Cookie', travelAdminCookie)
      .expect(404);

    expect((res.body as ApiErrorResponse).error.code).toBe('NOT_FOUND');
  });

  it('rejects invalid query parameters (e.g. invalid days=999) with 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/overview?days=999')
      .set('Cookie', superAdminCookie)
      .expect(400);

    expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });
});
