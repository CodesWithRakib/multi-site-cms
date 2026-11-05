import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  PlatformSettings,
  PublicPlatformSettings,
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

/**
 * Platform settings: Super Admin only, partial updates that never erase other
 * fields, strict validation of every nested field, and a public projection
 * that exposes no internal configuration.
 */
describe('Platform settings (/api/v1/settings)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  const password = 'SecurePassword123!';
  const sessions: Record<'owner' | 'siteAdmin', { cookie: string[]; csrf: string }> = {
    owner: { cookie: [], csrf: '' },
    siteAdmin: { cookie: [], csrf: '' },
  };

  async function login(email: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const header = res.headers['set-cookie'];
    const cookie = header ? (Array.isArray(header) ? header : [header]) : [];
    const csrf = cookie.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1];
    return { cookie, csrf: csrf ?? '' };
  }

  const patch = (body: unknown, who: 'owner' | 'siteAdmin' = 'owner') =>
    request(app.getHttpServer())
      .patch('/api/v1/settings/platform')
      .set('Cookie', sessions[who].cookie)
      .set('x-csrf-token', sessions[who].csrf)
      .send(body as object);

  const current = async () =>
    (
      (
        await request(app.getHttpServer())
          .get('/api/v1/settings/platform')
          .set('Cookie', sessions.owner.cookie)
          .expect(200)
      ).body as ApiSuccess<PlatformSettings>
    ).data;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    const [configure, readPosts] = await dataSource.getRepository(Permission).save([
      { key: 'platform:configure', description: 'configure' },
      { key: 'post:read', description: 'read' },
    ]);
    const roles = dataSource.getRepository(Role);
    const superAdmin = await roles.save({ key: 'super_admin', name: 'SA', scopeType: 'platform' });
    const admin = await roles.save({ key: 'admin', name: 'Admin', scopeType: 'site' });
    await dataSource.getRepository(RolePermission).save([
      { roleId: superAdmin.id, permissionId: configure!.id },
      { roleId: admin.id, permissionId: readPosts!.id },
    ]);
    const site = await dataSource.getRepository(Site).save({
      key: 'travel-blog',
      name: 'Travel',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });

    const hash = await new PasswordService().hash(password);
    const [owner, siteAdmin] = await dataSource.getRepository(User).save([
      { email: 'owner@example.test', displayName: 'Owner', passwordHash: hash, status: 'active' },
      { email: 'editor@example.test', displayName: 'Editor', passwordHash: hash, status: 'active' },
    ]);
    await dataSource.getRepository(UserRoleAssignment).save([
      { userId: owner!.id, roleId: superAdmin.id, scopeType: 'platform', siteId: null },
      { userId: siteAdmin!.id, roleId: admin.id, scopeType: 'site', siteId: site.id },
    ]);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    sessions.owner = await login('owner@example.test');
    sessions.siteAdmin = await login('editor@example.test');
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('is reserved for Super Admins', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/settings/platform')
      .set('Cookie', sessions.siteAdmin.cookie)
      .expect(403);
    await patch({ general: { platformName: 'Hijacked' } }, 'siteAdmin').expect(403);
    await request(app.getHttpServer()).get('/api/v1/settings/diagnostics').expect(401);
  });

  it('updates one field without erasing the others in its section', async () => {
    const before = await current();
    const res = await patch({ general: { platformName: 'Newsroom' } }).expect(200);
    const after = (res.body as ApiSuccess<PlatformSettings>).data;

    expect(after.general).toEqual({ ...before.general, platformName: 'Newsroom' });
    expect(after.security).toEqual(before.security);
  });

  it.each([
    ['an unknown section', { billing: { plan: 'pro' } }],
    ['an unknown field', { general: { isAdmin: true } }],
    ['a wrong type', { security: { maxLoginAttempts: '5' } }],
    ['an out-of-range number', { security: { passwordMinLength: 4 } }],
    ['an invalid email', { general: { contactEmail: 'nobody' } }],
    ['an invalid timezone', { general: { defaultTimezone: 'Mars/Olympus' } }],
    ['an unsupported locale', { general: { defaultLocale: 'fr' } }],
    ['a malformed MIME type', { media: { allowedMimeTypes: ['image/png', '<script>'] } }],
    ['a non-object section', { maintenance: 'on' }],
  ])('rejects %s and changes nothing', async (_label, body) => {
    const before = await current();
    const res = await patch(body).expect(400);
    expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
    expect(await current()).toEqual(before);
  });

  it('exposes only the public projection without signing in', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/settings/public').expect(200);
    const data = (res.body as ApiSuccess<PublicPlatformSettings>).data;
    expect(Object.keys(data).sort()).toEqual(
      [
        'defaultLocale',
        'defaultTimezone',
        'maintenanceMode',
        'maintenanceNoticeBn',
        'maintenanceNoticeEn',
        'platformName',
        'tagline',
      ].sort(),
    );
  });
});
