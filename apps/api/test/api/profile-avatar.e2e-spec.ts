import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  AuthUser,
  PublicArticleSummary,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { MediaAsset } from '../../src/database/entities/media-asset.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { ensurePlatformVocabulary } from '../../src/database/platform-vocabulary';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

/**
 * Self-service profile photo: a site admin picks an image from a site they
 * manage; it shows on /auth/me and as the author photo on published posts.
 */
describe('PATCH /api/v1/auth/me/avatar', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let cookie: string[] = [];
  let csrf = '';
  const email = 'ashiqur@example.test';
  const password = 'AvatarPassword123';
  const media: Record<'image' | 'pdf' | 'otherSiteImage', string> = {
    image: '',
    pdf: '',
    otherSiteImage: '',
  };

  const patchAvatar = (mediaId: string | null) =>
    request(app.getHttpServer())
      .patch('/api/v1/auth/me/avatar')
      .set('Cookie', cookie)
      .set('x-csrf-token', csrf)
      .send({ mediaId });

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    await ensurePlatformVocabulary(dataSource);

    const sites = dataSource.getRepository(Site);
    const travel = await sites.save({
      key: 'travel-blog',
      name: 'Travel Blog',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    const air = await sites.save({
      key: 'air-sports',
      name: 'Air Sports',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });

    const user = await dataSource.getRepository(User).save({
      email,
      displayName: 'Ashiqur Rahaman',
      passwordHash: await new PasswordService().hash(password),
      status: 'active',
    });
    const adminRole = await dataSource
      .getRepository(Role)
      .findOneOrFail({ where: { key: 'admin', scopeType: 'site' } });
    await dataSource.getRepository(UserRoleAssignment).save({
      userId: user.id,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: travel.id,
    });

    const assets = dataSource.getRepository(MediaAsset);
    const asset = (siteId: string, storageKey: string, mimeType: string) =>
      assets.save({ siteId, storageKey, mimeType, byteSize: '100', checksum: 'a'.repeat(64) });
    media.image = (await asset(travel.id, 'avatars/ashiqur.jpg', 'image/jpeg')).id;
    media.pdf = (await asset(travel.id, 'docs/cv.pdf', 'application/pdf')).id;
    media.otherSiteImage = (await asset(air.id, 'avatars/other.jpg', 'image/jpeg')).id;

    const post = await dataSource.getRepository(Post).save({
      authorId: user.id,
      type: 'article',
      status: 'approved',
      sourceLocale: 'en',
    });
    const revision = await dataSource.getRepository(PostRevision).save({
      postId: post.id,
      revisionNumber: 1,
      title: 'Hello from the road',
      body: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }],
      },
      createdBy: user.id,
    });
    await dataSource.getRepository(PostPublication).save({
      siteId: travel.id,
      postId: post.id,
      revisionId: revision.id,
      slug: 'hello-from-the-road',
      status: 'published',
      publishedAt: new Date(Date.now() - 60_000),
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    expect((res.body as ApiSuccess<{ user: AuthUser }>).data.user.avatarUrl).toBeNull();
    const header = res.headers['set-cookie'];
    cookie = header ? (Array.isArray(header) ? header : [header]) : [];
    csrf = cookie.find((c) => c.startsWith('cms_csrf='))?.match(/^cms_csrf=([^;]+)/)?.[1] ?? '';
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('sets the photo and exposes it on /auth/me and as the article author photo', async () => {
    const res = await patchAvatar(media.image).expect(200);
    const avatarUrl = (res.body as ApiSuccess<AuthUser>).data.avatarUrl;
    expect(avatarUrl).toContain('/media/assets/avatars/ashiqur.jpg');

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect((me.body as ApiSuccess<AuthUser>).data.avatarUrl).toBe(avatarUrl);

    const list = await request(app.getHttpServer())
      .get('/api/v1/public/sites/travel-blog/posts')
      .expect(200);
    const article = (list.body as ApiSuccess<PublicArticleSummary[]>).data[0];
    expect(article?.author).toEqual({
      id: expect.any(String),
      displayName: 'Ashiqur Rahaman',
      avatarUrl,
    });
  });

  it('rejects files that are not images', async () => {
    const res = await patchAvatar(media.pdf).expect(400);
    expect((res.body as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('hides media from sites the user does not manage (404, not 403)', async () => {
    await patchAvatar(media.otherSiteImage).expect(404);
  });

  it('removes the photo with null', async () => {
    const res = await patchAvatar(null).expect(200);
    expect((res.body as ApiSuccess<AuthUser>).data.avatarUrl).toBeNull();
  });

  it('requires a signed-in user', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/auth/me/avatar')
      .send({ mediaId: null })
      .expect(401);
  });
});
