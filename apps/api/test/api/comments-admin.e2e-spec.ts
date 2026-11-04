import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { AdminCommentsListResult, ApiSuccess, PostItem } from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { DATA_SOURCE } from '../../src/database/database.tokens';
import { Permission } from '../../src/database/entities/permission.entity';
import { PostComment } from '../../src/database/entities/post-comment.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { RolePermission } from '../../src/database/entities/role-permission.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * Admin comment moderation is site-scoped (SEC-12): a site admin can list and
 * moderate only comments of their own sites; everything else is an opaque 404.
 */
describe('Admin comment moderation isolation', () => {
  const password = 'SecurePassword123!';

  interface Session {
    cookies: string[];
    csrf: string;
  }

  let app: INestApplication;
  let dataSource: DataSource;
  let siteTravelId: string;
  let siteAirId: string;
  let travel: Session;
  let air: Session;
  let superAdmin: Session;
  let travelCommentId: string;
  let airCommentId: string;

  function cookiesOf(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) return [];
    return Array.isArray(header) ? header : [header];
  }

  async function login(email: string): Promise<Session> {
    const csrfRes = await request(app.getHttpServer()).get('/api/v1/auth/csrf');
    const csrf = (csrfRes.body as ApiSuccess<{ csrfToken: string }>).data.csrfToken;
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Cookie', cookiesOf(csrfRes))
      .set('x-csrf-token', csrf)
      .send({ email, password })
      .expect(200);
    return { cookies: [...cookiesOf(csrfRes), ...cookiesOf(loginRes)], csrf };
  }

  async function createPublishedPost(session: Session, siteId: string, slug: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Cookie', session.cookies)
      .set('x-csrf-token', session.csrf)
      .send({
        type: 'article',
        sourceLocale: 'en',
        title: slug,
        body: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: slug }] }],
        },
        publications: [{ siteId, slug, status: 'draft' }],
      })
      .expect(201);
    const postId = (res.body as ApiSuccess<PostItem>).data.id;
    return dataSource.getRepository(PostPublication).findOneByOrFail({ postId, siteId });
  }

  async function addComment(publication: PostPublication, author: string): Promise<string> {
    const saved = await dataSource.getRepository(PostComment).save({
      siteId: publication.siteId,
      publicationId: publication.id,
      authorName: author,
      authorEmail: `${author.toLowerCase()}@example.com`,
      content: `Comment by ${author}`,
      status: 'pending',
    });
    return saved.id;
  }

  async function statusOf(id: string): Promise<string | null> {
    const row = await dataSource.getRepository(PostComment).findOneBy({ id });
    return row?.status ?? null;
  }

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DATA_SOURCE)
      .useValue(dataSource)
      .compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();

    const permissions = await dataSource
      .getRepository(Permission)
      .save(
        ['post:create', 'post:read', 'post:update', 'post:delete', 'publication:publish'].map(
          (key) => ({ key, description: key }),
        ),
      );
    const roles = dataSource.getRepository(Role);
    const superRole = await roles.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });
    const adminRole = await roles.save({ key: 'admin', name: 'Site Admin', scopeType: 'site' });
    for (const p of permissions) {
      await dataSource.getRepository(RolePermission).save([
        { roleId: superRole.id, permissionId: p.id },
        { roleId: adminRole.id, permissionId: p.id },
      ]);
    }

    const sites = dataSource.getRepository(Site);
    siteTravelId = (
      await sites.save(sites.create({ key: 'travel-blog', name: 'Travel', status: 'active' }))
    ).id;
    siteAirId = (
      await sites.save(sites.create({ key: 'air-sports', name: 'Air', status: 'active' }))
    ).id;

    const passwordHash = await new PasswordService().hash(password);
    const users = dataSource.getRepository(User);
    const assignments = dataSource.getRepository(UserRoleAssignment);
    const seedUser = async (email: string, roleId: string, siteId: string | null) => {
      const user = await users.save(
        users.create({ email, displayName: email, passwordHash, status: 'active' }),
      );
      await assignments.save({
        userId: user.id,
        roleId,
        scopeType: siteId ? 'site' : 'platform',
        siteId,
      });
    };
    await seedUser('super@example.com', superRole.id, null);
    await seedUser('travel@example.com', adminRole.id, siteTravelId);
    await seedUser('air@example.com', adminRole.id, siteAirId);

    superAdmin = await login('super@example.com');
    travel = await login('travel@example.com');
    air = await login('air@example.com');

    travelCommentId = await addComment(
      await createPublishedPost(travel, siteTravelId, 'travel-post'),
      'Tara',
    );
    airCommentId = await addComment(await createPublishedPost(air, siteAirId, 'air-post'), 'Ari');
  }, 60_000);

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('lists only the caller’s own sites when no siteId is given', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/comments')
      .set('Cookie', air.cookies)
      .expect(200);

    const data = (res.body as ApiSuccess<AdminCommentsListResult>).data;
    expect(data.items.map((item) => item.id)).toEqual([airCommentId]);
    expect(data.counts.all).toBe(1);
  });

  it('lets a Super Admin list every site', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/comments')
      .set('Cookie', superAdmin.cookies)
      .expect(200);

    const ids = (res.body as ApiSuccess<AdminCommentsListResult>).data.items.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([airCommentId, travelCommentId]));
  });

  it('returns 404 for an explicit siteId the caller does not manage', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/comments?siteId=${siteTravelId}`)
      .set('Cookie', air.cookies)
      .expect(404);
  });

  it('cannot change the status of another site’s comment', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/comments/${travelCommentId}/status`)
      .set('Cookie', air.cookies)
      .set('x-csrf-token', air.csrf)
      .send({ status: 'approved' })
      .expect(404);

    expect(await statusOf(travelCommentId)).toBe('pending');
  });

  it('cannot delete another site’s comment', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/comments/${travelCommentId}`)
      .set('Cookie', air.cookies)
      .set('x-csrf-token', air.csrf)
      .expect(404);

    expect(await statusOf(travelCommentId)).toBe('pending');
  });

  it('rejects a whole batch that contains another site’s comment', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/comments/batch')
      .set('Cookie', air.cookies)
      .set('x-csrf-token', air.csrf)
      .send({ ids: [airCommentId, travelCommentId], status: 'approved' })
      .expect(404);

    expect(await statusOf(airCommentId)).toBe('pending');
    expect(await statusOf(travelCommentId)).toBe('pending');
  });

  it('moderates the caller’s own comments', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/comments/batch')
      .set('Cookie', air.cookies)
      .set('x-csrf-token', air.csrf)
      .send({ ids: [airCommentId], status: 'approved' })
      .expect(200);

    expect((res.body as ApiSuccess<{ updatedCount: number }>).data.updatedCount).toBe(1);
    expect(await statusOf(airCommentId)).toBe('approved');
  });
});
