import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  PaginatedResult,
  UserItem,
} from '@multi-site-cms/types';
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

describe('RBAC and Site-Level Authorization (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let superAdminId: string;
  let travelAdminId: string;
  let airSportsAdminId: string;

  let superAdminCookie: string[];
  let travelAdminCookie: string[];
  let airSportsAdminCookie: string[];

  let superAdminCsrf: string;
  let travelAdminCsrf: string;

  const defaultPassword = 'SecurePassword123!';

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    // 1. Create permissions
    const permRepo = dataSource.getRepository(Permission);
    const permissions = await permRepo.save([
      { key: 'site:read', description: 'Read site config' },
      { key: 'site:update_settings', description: 'Update site settings' },
      { key: 'user:read', description: 'Read platform users' },
      { key: 'user:manage', description: 'Manage platform users' },
      { key: 'role:assign', description: 'Assign roles and site access' },
    ]);

    // 2. Create roles
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

    // 3. Link permissions to roles
    const rpRepo = dataSource.getRepository(RolePermission);
    // Super Admin gets all permissions
    for (const p of permissions) {
      await rpRepo.save({ roleId: superAdminRole.id, permissionId: p.id });
    }
    // Site Admin gets site permissions only
    for (const p of permissions.filter((perm) => perm.key.startsWith('site:'))) {
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
      settings: { theme: 'light' },
    });
    siteTravelId = travelSite.id;

    const airSite = await siteRepo.save({
      key: 'air-sports',
      name: 'Air Sports Live',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: { theme: 'dark' },
    });
    siteAirSportsId = airSite.id;

    // 5. Create users with password hash
    const userRepo = dataSource.getRepository(User);
    const pwdHash = await passwordService.hash(defaultPassword);

    const superAdminUser = await userRepo.save({
      email: 'superadmin@example.test',
      displayName: 'Super Admin',
      passwordHash: pwdHash,
      status: 'active',
    });
    superAdminId = superAdminUser.id;

    const travelAdminUser = await userRepo.save({
      email: 'traveladmin@example.test',
      displayName: 'Travel Admin',
      passwordHash: pwdHash,
      status: 'active',
    });
    travelAdminId = travelAdminUser.id;

    const airAdminUser = await userRepo.save({
      email: 'airadmin@example.test',
      displayName: 'Air Admin',
      passwordHash: pwdHash,
      status: 'active',
    });
    airSportsAdminId = airAdminUser.id;

    // 6. Assign roles
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    // Super admin has platform scope
    await uraRepo.save({
      userId: superAdminId,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    // Travel Admin assigned to travelSite
    await uraRepo.save({
      userId: travelAdminId,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    // Air Sports Admin assigned to airSite
    await uraRepo.save({
      userId: airSportsAdminId,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteAirSportsId,
    });

    // 7. Start Nest application
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app as NestExpressApplication);
    await app.init();

    // 8. Log in as Super Admin
    const superLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@example.test', password: defaultPassword });
    superAdminCookie = extractSetCookies(superLogin);
    superAdminCsrf = extractCookieValue(superAdminCookie, 'cms_csrf');

    // 9. Log in as Travel Admin
    const travelLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'traveladmin@example.test', password: defaultPassword });
    travelAdminCookie = extractSetCookies(travelLogin);
    travelAdminCsrf = extractCookieValue(travelAdminCookie, 'cms_csrf');

    // 10. Log in as Air Sports Admin
    const airLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'airadmin@example.test', password: defaultPassword });
    airSportsAdminCookie = extractSetCookies(airLogin);
  });

  afterAll(async () => {
    await app.close();
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

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

  describe('Super Admin platform-wide capabilities', () => {
    it('allows Super Admin to access any site (Travel Blog)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      expect((res.body as ApiSuccess<{ key: string }>).data.key).toBe('travel-blog');
    });

    it('allows Super Admin to access any site (Air Sports)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      expect((res.body as ApiSuccess<{ key: string }>).data.key).toBe('air-sports');
    });

    it('allows Super Admin to list platform users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Cookie', superAdminCookie)
        .expect(200);

      const body = res.body as ApiSuccess<PaginatedResult<UserItem>>;
      expect(body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('allows Super Admin to update site settings with valid CSRF token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/settings`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ settings: { theme: 'emerald' } })
        .expect(200);

      expect((res.body as ApiSuccess<{ settings: { theme: string } }>).data.settings.theme).toBe(
        'emerald',
      );
    });
  });

  describe('Site isolation & IDOR prevention for site admins', () => {
    it('allows Travel Admin to access Travel Blog', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}`)
        .set('Cookie', travelAdminCookie)
        .expect(200);

      expect((res.body as ApiSuccess<{ key: string }>).data.key).toBe('travel-blog');
    });

    it('denies Travel Admin from accessing Air Sports with a 404 (IDOR prevention)', async () => {
      // Must return 404 rather than 403 to prevent confirming tenant existence
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}`)
        .set('Cookie', travelAdminCookie)
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('denies Travel Admin from updating Air Sports settings with a 404', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteAirSportsId}/settings`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({ settings: { theme: 'hacked' } })
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('allows Air Sports Admin to access Air Sports', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}`)
        .set('Cookie', airSportsAdminCookie)
        .expect(200);

      expect((res.body as ApiSuccess<{ key: string }>).data.key).toBe('air-sports');
    });

    it('denies Air Sports Admin from accessing Travel Blog with a 404', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}`)
        .set('Cookie', airSportsAdminCookie)
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Mandatory RBAC denials for ordinary Admins', () => {
    it('denies Travel Admin from listing platform users (403 FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Cookie', travelAdminCookie)
        .expect(403);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('denies Travel Admin from creating new users (403 FORBIDDEN)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          email: 'unauthorized-user@example.test',
          displayName: 'Unauthorized',
        })
        .expect(403);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('denies Travel Admin from assigning roles or promoting to Super Admin', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/users/${travelAdminId}/roles`)
        .set('Cookie', travelAdminCookie)
        .set('X-CSRF-Token', travelAdminCsrf)
        .send({
          roleKey: 'super_admin',
        })
        .expect(403);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Protection of the Super Admin boundary', () => {
    it('rejects deactivating the last active Super Admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${superAdminId}`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', superAdminCsrf)
        .send({ status: 'suspended' })
        .expect(400);

      const body = res.body as ApiErrorResponse;
      expect(body.error.message).toContain('Cannot deactivate or remove the last Super Admin');
    });
  });

  describe('CSRF Defense-in-Depth', () => {
    it('blocks state-changing mutation when session cookie is provided without CSRF token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/settings`)
        .set('Cookie', superAdminCookie)
        // Omitted X-CSRF-Token header
        .send({ settings: { theme: 'forged' } })
        .expect(403);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toContain('CSRF');
    });

    it('blocks state-changing mutation with mismatched CSRF token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/settings`)
        .set('Cookie', superAdminCookie)
        .set('X-CSRF-Token', 'invalid-token-123')
        .send({ settings: { theme: 'forged' } })
        .expect(403);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });
});
