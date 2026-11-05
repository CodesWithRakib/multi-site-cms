import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  EffectivePlatformPolicy,
  PostItem,
  PreviewTokenResponse,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { AuthService } from '../../src/auth/services/auth.service';
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
 * Platform settings are enforced, not just stored (SEC-18): each setting a
 * Super Admin changes takes effect in the API path it governs.
 *
 * The login route allows five attempts per minute per client, so this suite
 * performs at most four HTTP logins; concurrency checks call services directly.
 */
describe('Platform policy enforcement', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let siteId: string;
  let owner: { cookie: string[]; csrf: string };
  const password = 'SecurePassword123!';

  const png = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex',
  );
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4"/></svg>',
  );

  async function login(email: string, pass = password) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: pass });
    const header = res.headers['set-cookie'];
    const cookie = header ? (Array.isArray(header) ? header : [header]) : [];
    const csrf = cookie.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1];
    return { res, cookie, csrf: csrf ?? '' };
  }

  const as = (method: 'get' | 'post' | 'patch', path: string) => {
    const agent = request(app.getHttpServer());
    return agent[method](`/api/v1${path}`)
      .set('Cookie', owner.cookie)
      .set('x-csrf-token', owner.csrf);
  };

  async function configure(body: object): Promise<void> {
    await as('patch', '/settings/platform').send(body).expect(200);
  }

  async function createUserRow(email: string): Promise<User> {
    return dataSource.getRepository(User).save({
      email,
      displayName: email,
      passwordHash: await new PasswordService().hash(password),
      status: 'active',
    });
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    const permissions = await dataSource
      .getRepository(Permission)
      .save(
        [
          'platform:configure',
          'post:read',
          'post:create',
          'post:update',
          'media:upload',
          'user:manage',
        ].map((key) => ({ key, description: key })),
      );
    const role = await dataSource
      .getRepository(Role)
      .save({ key: 'super_admin', name: 'SA', scopeType: 'platform' });
    await dataSource
      .getRepository(RolePermission)
      .save(permissions.map((p) => ({ roleId: role.id, permissionId: p.id })));
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
    const ownerRow = await createUserRow('owner@example.test');
    await dataSource
      .getRepository(UserRoleAssignment)
      .save({ userId: ownerRow.id, roleId: role.id, scopeType: 'platform', siteId: null });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const session = await login('owner@example.test');
    owner = { cookie: session.cookie, csrf: session.csrf };
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('locks an account after the configured number of failed sign-ins', async () => {
    await configure({ security: { maxLoginAttempts: 2, lockoutDurationMinutes: 30 } });
    await createUserRow('target@example.test');

    expect((await login('target@example.test', 'Wrong-password-1')).res.status).toBe(401);
    expect((await login('target@example.test', 'Wrong-password-2')).res.status).toBe(401);
    // Correct password, but the account is now locked.
    const locked = await login('target@example.test');
    expect(locked.res.status).toBe(403);
    expect((locked.res.body as ApiErrorResponse).error.code).toBe('FORBIDDEN');

    const user = await dataSource
      .getRepository(User)
      .findOneByOrFail({ email: 'target@example.test' });
    const lockMinutes = ((user.lockedUntil?.getTime() ?? 0) - Date.now()) / 60_000;
    expect(lockMinutes).toBeGreaterThan(28);
    expect(lockMinutes).toBeLessThanOrEqual(30);
  });

  it('counts concurrent failed sign-ins without losing any', async () => {
    await configure({ security: { maxLoginAttempts: 20 } });
    await createUserRow('burst@example.test');
    const auth = app.get(AuthService);

    await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        auth.login({ email: 'burst@example.test', password: 'Wrong-password-0' }),
      ),
    );

    const user = await dataSource
      .getRepository(User)
      .findOneByOrFail({ email: 'burst@example.test' });
    expect(user.failedLoginCount).toBe(6);
  });

  it('applies the password rules to new and changed passwords', async () => {
    await configure({ security: { passwordMinLength: 12, requireStrongPasswords: true } });
    const create = (email: string, pass: string) =>
      as('post', '/users').send({ email, displayName: 'Policy', password: pass });

    const short = await create('short@example.test', 'Abcdefgh123');
    expect((short.body as ApiErrorResponse).error.message).toMatch(/minimum length/i);
    expect(short.status).toBe(400);
    const weak = await create('weak@example.test', 'alllowercase123');
    expect(weak.status).toBe(400);
    expect((weak.body as ApiErrorResponse).error.message).toMatch(/uppercase/i);
    await create('fine@example.test', 'Abcdefgh1234').expect(201);

    await configure({ security: { requireStrongPasswords: false } });
    await create('relaxed@example.test', 'alllowercase123').expect(201);
  });

  it('caps upload size and type at the configured limits', async () => {
    await configure({ media: { maxUploadSizeBytes: 64, allowedMimeTypes: ['image/svg+xml'] } });
    const upload = (file: Buffer, name: string) =>
      as('post', '/media/upload').field('siteId', siteId).attach('file', file, name);

    // 72-byte PNG: over the 64-byte limit.
    expect((await upload(png, 'pixel.png')).status).toBe(413);

    await configure({ media: { maxUploadSizeBytes: 1024 * 1024 } });
    // PNG is not in the allowed list (detected from the file signature).
    const refused = await upload(png, 'pixel.png');
    expect(refused.status).toBe(400);
    expect((refused.body as ApiErrorResponse).error.message).toMatch(/not allowed/i);
    expect((await upload(svg, 'square.svg')).status).toBe(201);

    // A type outside the code allowlist cannot be enabled through settings.
    await configure({ media: { allowedMimeTypes: ['image/png', 'application/x-msdownload'] } });
    const policy = (
      (await as('get', '/settings/policy').expect(200)).body as ApiSuccess<EffectivePlatformPolicy>
    ).data;
    expect(policy.allowedMimeTypes).toEqual(['image/png']);
  });

  it('uses the default post status, preview lifetime and revision limit', async () => {
    await configure({
      publishing: {
        defaultPostStatus: 'in_review',
        previewTokenTtlMinutes: 45,
        maxRevisionHistory: 2,
      },
    });

    const created = await as('post', '/posts')
      .send({ title: 'Policy post', type: 'article', body: { type: 'doc', content: [] } })
      .expect(201);
    const post = (created.body as ApiSuccess<PostItem>).data;
    expect(post.status).toBe('in_review');

    // Publish revision 1 so a publication references it.
    await as('post', `/posts/${post.id}/publications`)
      .send({ siteId, slug: 'policy-post', status: 'draft' })
      .expect(201);

    let expected = 1;
    for (let edit = 1; edit <= 4; edit++) {
      await as('patch', `/posts/${post.id}`)
        .send({ title: `Policy post v${edit + 1}`, expectedRevisionNumber: expected })
        .expect(200);
      expected++;
    }

    const revisions = (await dataSource.query(
      `SELECT "revision_number" FROM "post_revisions" WHERE "post_id" = $1 ORDER BY 1`,
      [post.id],
    )) as Array<{ revision_number: number }>;
    // Newest two, plus revision 1 that the publication still points to.
    expect(revisions.map((r) => r.revision_number)).toEqual([1, 4, 5]);

    const token = await as('post', `/posts/${post.id}/preview-token?siteId=${siteId}`);
    expect([200, 201]).toContain(token.status);
    const expiresAt = Date.parse((token.body as ApiSuccess<PreviewTokenResponse>).data.expiresAt);
    const minutes = (expiresAt - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(43);
    expect(minutes).toBeLessThanOrEqual(45);
  });

  it('expires existing sessions when the session lifetime is shortened', async () => {
    await configure({ security: { sessionTtlHours: 1 } });
    // Pretend the owner signed in two hours ago.
    await dataSource.query(
      `UPDATE "sessions" SET "created_at" = now() - interval '2 hours'
        WHERE "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'owner@example.test')`,
    );
    await as('get', '/auth/me').expect(401);
  });
});
