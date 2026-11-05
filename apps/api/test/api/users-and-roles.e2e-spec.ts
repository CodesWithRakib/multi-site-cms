import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  PaginatedResult,
  UserItem,
  UserStats,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import type { EffectiveAuthContext } from '../../src/auth/services/authorization.service';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { Permission } from '../../src/database/entities/permission.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { UsersService } from '../../src/users/users.service';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * User and role management: validation, role scoping, session revocation, and
 * the "at least one active Super Admin" invariant, including under concurrency.
 */
describe('Users and roles (/api/v1/users)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let users: UsersService;

  let siteId: string;
  let superAdminRoleId: string;
  let adminRoleId: string;
  let ownerId: string;
  let ownerCookie: string[];
  let ownerCsrf: string;

  const password = 'SecurePassword123!';

  const cookiesOf = (res: request.Response): string[] => {
    const header = res.headers['set-cookie'];
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  };
  const csrfOf = (cookies: string[]): string =>
    cookies.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1] ?? '';

  async function login(email: string): Promise<{ cookie: string[]; csrf: string }> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = cookiesOf(res);
    return { cookie, csrf: csrfOf(cookie) };
  }

  async function createUser(email: string, superAdmin = false): Promise<User> {
    const user = await dataSource.getRepository(User).save({
      email,
      displayName: email.split('@')[0] ?? email,
      passwordHash: await new PasswordService().hash(password),
      status: 'active',
    });
    if (superAdmin) {
      await dataSource.getRepository(UserRoleAssignment).save({
        userId: user.id,
        roleId: superAdminRoleId,
        scopeType: 'platform',
        siteId: null,
      });
    }
    return user;
  }

  function actor(user: User): EffectiveAuthContext {
    return {
      user,
      isSuperAdmin: true,
      roles: [],
      permissions: [],
      authorizedSiteIds: [],
      sitePermissions: {},
    };
  }

  const patchUser = (id: string, body: object) =>
    request(app.getHttpServer())
      .patch(`/api/v1/users/${id}`)
      .set('Cookie', ownerCookie)
      .set('x-csrf-token', ownerCsrf)
      .send(body);

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    const permissions = await dataSource.getRepository(Permission).save(
      ['user:read', 'user:manage', 'role:assign', 'post:read'].map((key) => ({
        key,
        description: key,
      })),
    );
    const roles = dataSource.getRepository(Role);
    const superAdminRole = await roles.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });
    const adminRole = await roles.save({ key: 'admin', name: 'Admin', scopeType: 'site' });
    superAdminRoleId = superAdminRole.id;
    adminRoleId = adminRole.id;
    const links = dataSource.getRepository(RolePermission);
    for (const permission of permissions) {
      await links.save({ roleId: superAdminRole.id, permissionId: permission.id });
    }
    const postRead = permissions.find((p) => p.key === 'post:read');
    if (postRead) await links.save({ roleId: adminRole.id, permissionId: postRead.id });

    siteId = (
      await dataSource.getRepository(Site).save({
        key: 'travel-blog',
        name: 'Travel',
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
        settings: {},
      })
    ).id;

    ownerId = (await createUser('owner@example.test', true)).id;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    users = app.get(UsersService);

    ({ cookie: ownerCookie, csrf: ownerCsrf } = await login('owner@example.test'));
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('lists users with their roles and never exposes credentials', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Cookie', ownerCookie)
      .expect(200);

    const page = (res.body as ApiSuccess<PaginatedResult<UserItem>>).data;
    const owner = page.items.find((item) => item.id === ownerId);
    expect(owner?.roles.map((role) => role.roleKey)).toEqual(['super_admin']);
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('searches, filters by role and site, and counts users in the database', async () => {
    const editor = await createUser('desk_editor@example.test');
    await dataSource.getRepository(UserRoleAssignment).save({
      userId: editor.id,
      roleId: adminRoleId,
      scopeType: 'site',
      siteId,
    });
    await createUser('plain.reader@example.test');

    const list = async (query: string) => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/users?${query}`)
        .set('Cookie', ownerCookie)
        .expect(200);
      return (res.body as ApiSuccess<PaginatedResult<UserItem>>).data.items.map((u) => u.email);
    };

    // Regression: the admin search used to answer 400 (unknown "search" field).
    expect(await list('search=DESK_ED')).toEqual(['desk_editor@example.test']);
    // LIKE wildcards are literal: "_" must not match any character.
    expect(await list('search=desk_')).toEqual(['desk_editor@example.test']);
    expect(await list('search=%25')).toEqual([]);
    expect(await list('roleKey=admin')).toEqual(['desk_editor@example.test']);
    expect(await list(`siteId=${siteId}`)).toEqual(['desk_editor@example.test']);
    expect(await list('roleKey=super_admin')).toEqual(['owner@example.test']);

    await request(app.getHttpServer())
      .get('/api/v1/users?status=locked')
      .set('Cookie', ownerCookie)
      .expect(400);

    const stats = await request(app.getHttpServer())
      .get('/api/v1/users/stats')
      .set('Cookie', ownerCookie)
      .expect(200);
    expect((stats.body as ApiSuccess<UserStats>).data).toMatchObject({
      superAdmins: 1,
      activeSuperAdmins: 1,
      siteAdmins: 1,
      byStatus: expect.objectContaining({ active: expect.any(Number) }),
    });
    const total = (stats.body as ApiSuccess<UserStats>).data.total;
    const [countRow] = (await dataSource.query(
      `SELECT COUNT(*)::int AS "n" FROM "users"`,
    )) as Array<{
      n: number;
    }>;
    expect(total).toBe(countRow?.n);
  });

  it('stores an optional E.164 phone, normalizes it, and clears it with null', async () => {
    const member = await createUser('phone.owner@example.test');

    const set = await patchUser(member.id, { phone: '+880 1767-476724' }).expect(200);
    expect((set.body as ApiSuccess<UserItem>).data.phone).toBe('+8801767476724');

    await patchUser(member.id, { phone: '01767476724' }).expect(400); // no country code
    await patchUser(member.id, { phone: '+12' }).expect(400);

    const cleared = await patchUser(member.id, { phone: null }).expect(200);
    expect((cleared.body as ApiSuccess<UserItem>).data.phone).toBeNull();

    // The database refuses a malformed value even if the API were bypassed.
    await expect(
      dataSource.query(`UPDATE "users" SET "phone" = 'not-a-phone' WHERE "id" = $1`, [member.id]),
    ).rejects.toThrow(/CHK_users_phone_e164/);
  });

  it('creates a user with a normalized email and rejects duplicates and bad input', async () => {
    const create = (body: object) =>
      request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Cookie', ownerCookie)
        .set('x-csrf-token', ownerCsrf)
        .send(body);

    const res = await create({ email: '  New.Editor@Example.TEST ', displayName: 'New Editor' });
    expect(res.status).toBe(201);
    const created = (res.body as ApiSuccess<UserItem>).data;
    expect(created.email).toBe('new.editor@example.test');
    expect(created.status).toBe('invited'); // no password: must finish onboarding

    await create({ email: 'new.editor@example.test', displayName: 'Again' }).expect(409);
    await create({ email: 'not-an-email', displayName: 'Bad' }).expect(400);
    await create({ email: 'short@example.test', displayName: 'Short', password: '1234567' }).expect(
      400,
    );
    await create({ email: 'x@example.test', displayName: 'X', isSuperAdmin: true }).expect(400);
  });

  it('scopes roles: site roles need a site, platform roles refuse one', async () => {
    const editor = await createUser('scoped@example.test');
    const assign = (body: object) =>
      request(app.getHttpServer())
        .post(`/api/v1/users/${editor.id}/roles`)
        .set('Cookie', ownerCookie)
        .set('x-csrf-token', ownerCsrf)
        .send(body);

    await assign({ roleKey: 'admin' }).expect(400);
    await assign({ roleKey: 'super_admin', siteId }).expect(400);

    const res = await assign({ roleKey: 'admin', siteId });
    expect([200, 201]).toContain(res.status);
    const roles = (res.body as ApiSuccess<UserItem>).data.roles;
    expect(roles).toEqual([
      expect.objectContaining({ roleId: adminRoleId, scopeType: 'site', siteId }),
    ]);

    // Idempotent: assigning again does not duplicate the role.
    const again = await assign({ roleKey: 'admin', siteId });
    expect((again.body as ApiSuccess<UserItem>).data.roles).toHaveLength(1);
  });

  it('signs a suspended user out immediately', async () => {
    const member = await createUser('member@example.test');
    const session = await login('member@example.test');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', session.cookie)
      .expect(200);

    await patchUser(member.id, { status: 'suspended' }).expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', session.cookie)
      .expect(401);
  });

  it('refuses to deactivate the last active Super Admin', async () => {
    const res = await patchUser(ownerId, { status: 'suspended' }).expect(400);
    expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('allows removing Super Admin from an inactive account (regression)', async () => {
    // A suspended Super Admin does not count as active, so revoking their role
    // never threatens the invariant. It used to be refused.
    const retired = await createUser('retired@example.test', true);
    await patchUser(retired.id, { status: 'suspended' }).expect(200);
    const assignment = await dataSource
      .getRepository(UserRoleAssignment)
      .findOneByOrFail({ userId: retired.id });

    await request(app.getHttpServer())
      .delete(`/api/v1/users/${retired.id}/roles/${assignment.id}`)
      .set('Cookie', ownerCookie)
      .set('x-csrf-token', ownerCsrf)
      .expect(200);
  });

  it('serializes Super Admin deactivation on the invariant lock', async () => {
    // Deterministic proof of the race fix: while another transaction holds the
    // lock, a deactivation must wait instead of counting stale state.
    const spare = await createUser('spare@example.test', true);
    const owner = await dataSource.getRepository(User).findOneByOrFail({ id: ownerId });
    const holder = dataSource.createQueryRunner();
    await holder.connect();
    await holder.startTransaction();
    try {
      await holder.query('SELECT pg_advisory_xact_lock(7316002)');
      let settled = false;
      const pending = users
        .updateUser(spare.id, { status: 'suspended' }, actor(owner))
        .finally(() => {
          settled = true;
        });

      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(settled).toBe(false);

      await holder.commitTransaction();
      await expect(pending).resolves.toMatchObject({ status: 'suspended' });
    } finally {
      if (holder.isTransactionActive) await holder.rollbackTransaction();
      await holder.release();
    }
  });

  it('keeps one active Super Admin when two are deactivated concurrently', async () => {
    const second = await createUser('second@example.test', true);
    const owner = await dataSource.getRepository(User).findOneByOrFail({ id: ownerId });

    const results = await Promise.allSettled([
      users.updateUser(ownerId, { status: 'suspended' }, actor(second)),
      users.updateUser(second.id, { status: 'suspended' }, actor(owner)),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);

    const [row] = (await dataSource.query(
      `SELECT COUNT(*)::int AS "count" FROM "user_role_assignments" ura
       JOIN "roles" r ON r."id" = ura."role_id"
       JOIN "users" u ON u."id" = ura."user_id"
       WHERE r."key" = 'super_admin' AND u."status" = 'active'`,
    )) as Array<{ count: number }>;
    expect(row?.count).toBe(1);
  });
});
