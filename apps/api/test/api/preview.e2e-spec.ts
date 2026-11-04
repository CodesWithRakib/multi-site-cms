import crypto from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  PostItem,
  PostPreviewData,
  PreviewTokenResponse,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { DATA_SOURCE } from '../../src/database/database.tokens';
import { Permission } from '../../src/database/entities/permission.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { Post } from '../../src/database/entities/post.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Authenticated Post Draft Preview System', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let travelAdminCookie: string[];
  let airSportsAdminCookie: string[];
  let travelAdminCsrf: string;
  let airSportsAdminCsrf: string;

  let testPostId: string;

  const defaultPassword = 'SecurePassword123!';

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATA_SOURCE)
      .useValue(dataSource)
      .compile();

    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();

    // 1. Seed Roles & Permissions
    const permRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);
    const rolePermRepo = dataSource.getRepository(RolePermission);
    const userRepo = dataSource.getRepository(User);
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    const siteRepo = dataSource.getRepository(Site);

    const permissionKeys = [
      'post:create',
      'post:read',
      'post:update',
      'post:delete',
      'publication:publish',
      'publication:read',
    ];

    const permissions: Permission[] = [];
    for (const key of permissionKeys) {
      const p = await permRepo.save({ key, description: `Permission for ${key}` });
      permissions.push(p);
    }

    const superAdminRole = await roleRepo.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });

    const siteAdminRole = await roleRepo.save({
      key: 'admin',
      name: 'Site Admin',
      scopeType: 'site',
    });

    for (const p of permissions) {
      await rolePermRepo.save({
        roleId: superAdminRole.id,
        permissionId: p.id,
      });
      await rolePermRepo.save({
        roleId: siteAdminRole.id,
        permissionId: p.id,
      });
    }

    // 2. Seed Sites
    const travelSite = await siteRepo.save(
      siteRepo.create({
        key: 'travel-blog',
        name: 'Travel Blog',
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
      }),
    );
    siteTravelId = travelSite.id;

    const airSportsSite = await siteRepo.save(
      siteRepo.create({
        key: 'air-sports',
        name: 'Air Sports Live',
        defaultLocale: 'en',
        timezone: 'UTC',
        status: 'active',
      }),
    );
    siteAirSportsId = airSportsSite.id;

    // 3. Seed Users
    const passwordHash = await passwordService.hash(defaultPassword);

    const superUser = await userRepo.save(
      userRepo.create({
        email: 'super@platform.internal',
        displayName: 'Super Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: superUser.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    const travelUser = await userRepo.save(
      userRepo.create({
        email: 'travel-admin@example.com',
        displayName: 'Travel Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: travelUser.id,
      roleId: siteAdminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    const airSportsUser = await userRepo.save(
      userRepo.create({
        email: 'airsports-admin@example.com',
        displayName: 'Air Sports Admin',
        passwordHash,
        status: 'active',
      }),
    );
    await uraRepo.save({
      userId: airSportsUser.id,
      roleId: siteAdminRole.id,
      scopeType: 'site',
      siteId: siteAirSportsId,
    });

    // 4. Authenticate Actors
    async function login(email: string) {
      const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
      const cookies = extractSetCookies(csrfRes);
      const csrfToken = csrfRes.body.data.csrfToken;

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ email, password: defaultPassword });

      const finalCookies = [
        ...cookies.filter((c) => !c.startsWith('multi_site_cms_access_token')),
        ...extractSetCookies(loginRes),
      ];

      return { cookies: finalCookies, csrfToken };
    }

    const t = await login('travel-admin@example.com');
    travelAdminCookie = t.cookies;
    travelAdminCsrf = t.csrfToken;

    const a = await login('airsports-admin@example.com');
    airSportsAdminCookie = a.cookies;
    airSportsAdminCsrf = a.csrfToken;

    // 5. Create a Canonical Post
    const createPostRes = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Cookie', travelAdminCookie)
      .set('x-csrf-token', travelAdminCsrf)
      .send({
        type: 'travel_guide',
        sourceLocale: 'en',
        title: 'Hidden Trails of the Alps',
        excerpt: 'An adventurous guide through secret alpine valleys.',
        body: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Alpine trails are majestic.' }],
            },
          ],
        },
      });

    expect(createPostRes.status).toBe(201);
    const postBody = createPostRes.body as ApiSuccess<PostItem>;
    testPostId = postBody.data.id;

    // 6. Create Publication on Travel Blog site
    const pubRes = await request(app.getHttpServer())
      .post(`/api/v1/posts/${testPostId}/publications`)
      .set('Cookie', travelAdminCookie)
      .set('x-csrf-token', travelAdminCsrf)
      .send({
        siteId: siteTravelId,
        slug: 'hidden-trails-of-the-alps',
        status: 'draft',
        seoTitle: 'Hidden Trails Alps Guide',
        seoDescription: 'Guide to alpine exploration.',
      });

    expect(pubRes.status).toBe(201);
  }, 60000);

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Preview Workflow', () => {
    let validToken: string;

    it('generates a signed, short-lived preview token', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${testPostId}/preview-token?siteId=${siteTravelId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(201);
      const body = res.body as ApiSuccess<PreviewTokenResponse>;
      expect(body.data.token).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.previewUrl).toContain('/preview');
      expect(body.data.previewUrl).toContain(`token=${body.data.token}`);

      validToken = body.data.token;
    });

    it('retrieves the draft preview data with simulated site context and noindex header', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/posts/${testPostId}/preview?siteId=${siteTravelId}&token=${validToken}`,
      );

      expect(res.status).toBe(200);
      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');

      const body = res.body as ApiSuccess<PostPreviewData>;
      expect(body.data.post.id).toBe(testPostId);
      expect(body.data.revision.title).toBe('Hidden Trails of the Alps');
      expect(body.data.revision.body).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Alpine trails are majestic.' }],
          },
        ],
      });
      expect(body.data.publication).toBeDefined();
      expect(body.data.publication?.slug).toBe('hidden-trails-of-the-alps');
      expect(body.data.site?.key).toBe('travel-blog');
    });

    it('rejects a tampered preview token with 401 Unauthorized', async () => {
      const tamperedToken = validToken + 'corrupt';

      const res = await request(app.getHttpServer()).get(
        `/api/v1/posts/${testPostId}/preview?siteId=${siteTravelId}&token=${tamperedToken}`,
      );

      expect(res.status).toBe(401);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects an expired preview token with 401 Unauthorized', async () => {
      // Signed with the real key (set in test/setup-env.ts), so only expiry can fail it.
      const secret = process.env.PREVIEW_TOKEN_SECRET ?? '';
      expect(secret).not.toBe('');
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 300; // 5 minutes in past
      const payload = `${testPostId}:${siteTravelId}:actor-1:${expiredTimestamp}`;
      const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const expiredToken = Buffer.from(`${payload}:${sig}`).toString('base64url');

      const res = await request(app.getHttpServer()).get(
        `/api/v1/posts/${testPostId}/preview?siteId=${siteTravelId}&token=${expiredToken}`,
      );

      expect(res.status).toBe(401);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects a token forged with the former hardcoded fallback key (regression: SEC-1)', async () => {
      const exp = Math.floor(Date.now() / 1000) + 300;
      const payload = `${testPostId}:${siteTravelId}:actor-1:${exp}`;
      const sig = crypto
        .createHmac('sha256', 'preview-secret-key-multi-site-cms-development-2026')
        .update(payload)
        .digest('hex');
      const forgedToken = Buffer.from(`${payload}:${sig}`).toString('base64url');

      const res = await request(app.getHttpServer()).get(
        `/api/v1/posts/${testPostId}/preview?siteId=${siteTravelId}&token=${forgedToken}`,
      );

      expect(res.status).toBe(401);
    });

    it('rejects a valid token replayed against a different site (regression: SEC-3)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/posts/${testPostId}/preview?siteId=${siteAirSportsId}&token=${validToken}`,
      );

      expect(res.status).toBe(401);
      const err = res.body as ApiErrorResponse;
      expect(err.error.code).toBe('UNAUTHENTICATED');
    });

    it('denies minting a site-less token for a post on a site the caller cannot access (regression: SEC-2)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${testPostId}/preview-token`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect(res.status).toBe(404);
    });

    it('enforces tenant isolation: Air Sports admin cannot request preview token for Travel Blog', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${testPostId}/preview-token?siteId=${siteTravelId}`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect([403, 404]).toContain(res.status);
    });
  });

  // Cross-site isolation for canonical posts (SEC-8 sweep). Lives here because
  // this fixture grants site admins the full post/publication permission set.
  describe('Cross-site post isolation', () => {
    async function createTravelOnlyPost(title: string): Promise<string> {
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          type: 'article',
          sourceLocale: 'en',
          title,
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: title }] }],
          },
          publications: [
            {
              siteId: siteTravelId,
              slug: title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
              status: 'draft',
            },
          ],
        });
      expect(res.status).toBe(201);
      return (res.body as ApiSuccess<PostItem>).data.id;
    }

    it("denies publishing another site's post onto your own site (regression: SEC-11)", async () => {
      const postId = await createTravelOnlyPost('Travel Only Draft');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${postId}/publications`)
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf)
        .send({ siteId: siteAirSportsId, slug: 'hijacked-draft', status: 'draft' });

      expect(res.status).toBe(404);
      const count = await dataSource
        .getRepository(PostPublication)
        .count({ where: { postId, siteId: siteAirSportsId } });
      expect(count).toBe(0);
    });

    it.each([
      ['GET', ''],
      ['PATCH', ''],
      ['DELETE', ''],
      ['GET', '/revisions'],
      ['GET', '/revisions/1'],
      ['POST', '/revisions/1/restore'],
    ])('returns 404 to an admin of another site for %s /posts/:id%s', async (method, suffix) => {
      const postId = await createTravelOnlyPost(`Isolation ${method} ${suffix || 'root'}`);
      const url = `/api/v1/posts/${postId}${suffix}`;
      const server = app.getHttpServer();
      const req =
        method === 'GET'
          ? request(server).get(url)
          : method === 'PATCH'
            ? request(server).patch(url).send({ title: 'Hijacked', expectedRevisionNumber: 1 })
            : method === 'DELETE'
              ? request(server).delete(url)
              : request(server).post(url).send({});

      const res = await req
        .set('Cookie', airSportsAdminCookie)
        .set('x-csrf-token', airSportsAdminCsrf);

      expect(res.status).toBe(404);
      const post = await dataSource.getRepository(Post).findOneByOrFail({ id: postId });
      expect(post.deletedAt).toBeNull();
    });

    it('forbids archiving a post that is also published on a site you do not manage', async () => {
      const postId = await createTravelOnlyPost('Shared Across Sites');
      const travelPublication = await dataSource
        .getRepository(PostPublication)
        .findOneByOrFail({ postId, siteId: siteTravelId });
      // Fixture: the same post is also published on Air Sports (as a Super Admin would do).
      await dataSource.getRepository(PostPublication).insert({
        postId,
        siteId: siteAirSportsId,
        slug: 'shared-across-sites',
        status: 'draft',
        revisionId: travelPublication.revisionId,
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/posts/${postId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(403);
      const airPublication = await dataSource
        .getRepository(PostPublication)
        .findOneByOrFail({ postId, siteId: siteAirSportsId });
      expect(airPublication.status).toBe('draft');
    });

    it('still lets an admin archive a post published only on their own site', async () => {
      const postId = await createTravelOnlyPost('Own Site Only');

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/posts/${postId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf);

      expect(res.status).toBe(204);
    });
  });
});
