import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiErrorResponse,
  ApiSuccess,
  CategoryItem,
  MediaAssetItem,
  PaginatedResult,
  PostItem,
  PostPublicationItem,
  PostRevisionItem,
  PostStatusCounts,
  TagItem,
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

describe('CMS Core (Posts, Publications, Taxonomy, Media, OCC & Tenant Isolation)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;

  let siteTravelId: string;
  let siteAirSportsId: string;

  let superAdminCookie: string[];
  let travelAdminCookie: string[];
  let airSportsAdminCookie: string[];
  let superAdminCsrf: string;
  let travelAdminCsrf: string;

  const defaultPassword = 'SecurePassword123!';

  function extractSetCookies(res: request.Response): string[] {
    const header = res.headers['set-cookie'];
    if (!header) return [];
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

    // 1. Seed Permissions for CMS Core & Sites
    const permRepo = dataSource.getRepository(Permission);
    const permissionKeys = [
      'post:read',
      'post:create',
      'post:update',
      'post:delete',
      'publication:publish',
      'publication:archive',
      'taxonomy:manage',
      'media:upload',
      'media:delete',
      'site:read',
      'site:update_settings',
    ];

    const permissions: Permission[] = [];
    for (const key of permissionKeys) {
      const p = await permRepo.save({ key, description: `Permission for ${key}` });
      permissions.push(p);
    }

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

    // 3. Link permissions to roles
    const rpRepo = dataSource.getRepository(RolePermission);
    for (const p of permissions) {
      await rpRepo.save({ roleId: superAdminRole.id, permissionId: p.id });
      await rpRepo.save({ roleId: adminRole.id, permissionId: p.id });
    }

    // 4. Seed Sites (Travel Blog and Air Sports)
    const siteRepo = dataSource.getRepository(Site);
    const travelSite = await siteRepo.save({
      key: 'travel-blog',
      name: 'Global Travel Blog',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteTravelId = travelSite.id;

    const airSportsSite = await siteRepo.save({
      key: 'air-sports',
      name: 'Air Sports Live Updates',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteAirSportsId = airSportsSite.id;

    // 5. Seed Users
    const userRepo = dataSource.getRepository(User);
    const passwordHash = await passwordService.hash(defaultPassword);

    const superAdminUser = await userRepo.save({
      email: 'superadmin@platform.internal',
      passwordHash,
      displayName: 'Super Administrator',
      status: 'active',
    });

    const travelAdminUser = await userRepo.save({
      email: 'traveladmin@travelblog.internal',
      passwordHash,
      displayName: 'Travel Site Admin',
      status: 'active',
    });

    const airSportsAdminUser = await userRepo.save({
      email: 'airsportsadmin@airsports.internal',
      passwordHash,
      displayName: 'Air Sports Site Admin',
      status: 'active',
    });

    // 6. Role Assignments
    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    await uraRepo.save({
      userId: superAdminUser.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    await uraRepo.save({
      userId: travelAdminUser.id,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteTravelId,
    });

    await uraRepo.save({
      userId: airSportsAdminUser.id,
      roleId: adminRole.id,
      scopeType: 'site',
      siteId: siteAirSportsId,
    });

    // 7. Initialize Nest App
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(moduleRef.createNestApplication<NestExpressApplication>());
    await app.init();

    // 8. Log in Super Admin
    const superLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@platform.internal', password: defaultPassword });
    superAdminCookie = extractSetCookies(superLogin);
    superAdminCsrf = extractCookieValue(superAdminCookie, 'cms_csrf');

    // 9. Log in Travel Admin
    const travelLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'traveladmin@travelblog.internal', password: defaultPassword });
    travelAdminCookie = extractSetCookies(travelLogin);
    travelAdminCsrf = extractCookieValue(travelAdminCookie, 'cms_csrf');

    // 10. Log in Air Sports Admin
    const airLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'airsportsadmin@airsports.internal', password: defaultPassword });
    airSportsAdminCookie = extractSetCookies(airLogin);
  });

  afterAll(async () => {
    await app?.close();
    await dataSource?.destroy();
  });

  describe('1. Canonical Content & Structured Body Validation', () => {
    let createdPostId: string;

    const validBody = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Welcome to our Himalayan expedition guide!',
            },
          ],
        },
      ],
    };

    it('rejects post creation when body contains dangerous javascript: link URI', async () => {
      const maliciousBody = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Click here for free gems',
                marks: [
                  {
                    type: 'link',
                    attrs: { href: 'javascript:alert(document.cookie)' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          title: 'Malicious Post Attempt',
          type: 'article',
          body: maliciousBody,
        })
        .expect(400);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates a canonical post with initial revision (Revision 1)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          title: 'Himalayan Expedition: Annapurna Circuit',
          excerpt: 'An in-depth guide to traversing the Annapurna region.',
          type: 'travel_guide',
          sourceLocale: 'en',
          body: validBody,
        })
        .expect(201);

      const body = res.body as ApiSuccess<PostItem>;
      expect(body.data.id).toBeDefined();
      expect(body.data.type).toBe('travel_guide');
      expect(body.data.currentRevisionNumber).toBe(1);
      expect(body.data.currentRevision?.title).toBe('Himalayan Expedition: Annapurna Circuit');
      createdPostId = body.data.id;
    });

    it('retrieves the created post by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/posts/${createdPostId}`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const body = res.body as ApiSuccess<PostItem>;
      expect(body.data.id).toBe(createdPostId);
      expect(body.data.currentRevisionNumber).toBe(1);
    });

    it('lists canonical posts with filtering and search', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/posts?type=travel_guide&search=Annapurna')
        .set('Cookie', superAdminCookie)
        .expect(200);

      const body = res.body as ApiSuccess<PaginatedResult<PostItem>>;
      expect(body.data.total).toBe(1);
      expect(body.data.items[0]?.id).toBe(createdPostId);
    });
  });

  describe('2. Multi-Site Publication Independence & Slug Uniqueness', () => {
    let canonicalPostId: string;
    let travelPubId: string;
    let airSportsPubId: string;

    beforeAll(async () => {
      // Create a shared canonical post
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          title: 'Extreme Weather in the Alps',
          type: 'article',
          body: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Alpine weather updates.' }] },
            ],
          },
        })
        .expect(201);

      canonicalPostId = (res.body as ApiSuccess<PostItem>).data.id;
    });

    it('publishes the post to Travel Blog with slug "alpine-weather-watch"', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${canonicalPostId}/publications`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          siteId: siteTravelId,
          slug: 'alpine-weather-watch',
          status: 'published',
          seoTitle: 'Travelers Alpine Weather Guide',
          seoDescription: 'Essential mountain weather forecast for backpackers.',
        })
        .expect(201);

      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.siteId).toBe(siteTravelId);
      expect(body.data.slug).toBe('alpine-weather-watch');
      expect(body.data.status).toBe('published');
      expect(body.data.publishedAt).toBeDefined();
      travelPubId = body.data.id;
    });

    it('publishes the SAME post to Air Sports Live with the SAME slug independently', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${canonicalPostId}/publications`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          siteId: siteAirSportsId,
          slug: 'alpine-weather-watch', // Same slug on different site is allowed!
          status: 'draft',
          seoTitle: 'Paragliding & Wing-Suit Flight Weather Advisory',
        })
        .expect(201);

      const body = res.body as ApiSuccess<PostPublicationItem>;
      expect(body.data.siteId).toBe(siteAirSportsId);
      expect(body.data.slug).toBe('alpine-weather-watch');
      expect(body.data.status).toBe('draft');
      airSportsPubId = body.data.id;
      expect(airSportsPubId).not.toBe(travelPubId);
    });

    it('rejects duplicate publication for the SAME site and post with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${canonicalPostId}/publications`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          siteId: siteTravelId,
          slug: 'another-slug',
        })
        .expect(409);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('CONFLICT');
    });

    it('rejects duplicate slug on the SAME site with 409 Conflict', async () => {
      // Create a second post
      const secondPostRes = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          title: 'Another Alpine Article',
          type: 'article',
          body: {
            type: 'doc',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Second alpine report.' }] },
            ],
          },
        })
        .expect(201);

      const secondPostId = (secondPostRes.body as ApiSuccess<PostItem>).data.id;

      // Attempt to publish with conflicting slug on Travel Blog
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${secondPostId}/publications`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          siteId: siteTravelId,
          slug: 'alpine-weather-watch', // Already exists on siteTravelId
        })
        .expect(409);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('CONFLICT');
    });

    it('filters by the publication status on the selected site, not on any site', async () => {
      const listIds = async (query: string) => {
        const res = await request(app.getHttpServer())
          .get(`/api/v1/posts?limit=100&${query}`)
          .set('Cookie', superAdminCookie)
          .expect(200);
        return (res.body as ApiSuccess<PaginatedResult<PostItem>>).data.items.map((p) => p.id);
      };

      // Published on Travel, draft on Air Sports.
      expect(await listIds(`siteId=${siteTravelId}&status=published`)).toContain(canonicalPostId);
      expect(await listIds(`siteId=${siteAirSportsId}&status=published`)).not.toContain(
        canonicalPostId,
      );
      expect(await listIds(`siteId=${siteAirSportsId}&status=draft`)).toContain(canonicalPostId);
      // Across all sites a post shows its most advanced publication status.
      expect(await listIds('status=published')).toContain(canonicalPostId);
      expect(await listIds('status=draft')).not.toContain(canonicalPostId);
    });

    it('counts posts per status in the database, matching the filtered lists', async () => {
      const getJson = async <T>(path: string, cookie = superAdminCookie, status = 200) =>
        (
          (await request(app.getHttpServer()).get(path).set('Cookie', cookie).expect(status))
            .body as ApiSuccess<T>
        ).data;

      for (const scope of ['', `siteId=${siteTravelId}`, `siteId=${siteAirSportsId}`]) {
        const stats = await getJson<PostStatusCounts>(`/api/v1/posts/stats?${scope}`);
        const all = await getJson<PaginatedResult<PostItem>>(`/api/v1/posts?limit=1&${scope}`);
        expect(stats.total).toBe(all.total);

        for (const [status, expected] of Object.entries(stats.byStatus)) {
          const filtered = await getJson<PaginatedResult<PostItem>>(
            `/api/v1/posts?limit=1&status=${status}&${scope}`,
          );
          expect({ scope, status, count: filtered.total }).toEqual({
            scope,
            status,
            count: expected,
          });
        }
      }

      const airStats = await getJson<PostStatusCounts>(
        `/api/v1/posts/stats?siteId=${siteAirSportsId}`,
      );
      expect(airStats.byStatus.draft).toBeGreaterThanOrEqual(1);
      expect(airStats.byStatus.published).toBe(0);
    });

    it('refuses status counts for a site the admin cannot access', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/posts/stats?siteId=${siteAirSportsId}`)
        .set('Cookie', travelAdminCookie)
        .expect(404);
      await request(app.getHttpServer())
        .get('/api/v1/posts/stats?siteId=not-a-uuid')
        .set('Cookie', superAdminCookie)
        .expect(400);
      await request(app.getHttpServer()).get('/api/v1/posts/stats').expect(401);
    });
  });

  describe('3. Optimistic Concurrency Control (OCC) & Immutable Revisions', () => {
    let occPostId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          title: 'Versioned Article Title V1',
          type: 'article',
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Initial body V1' }] }],
          },
        })
        .expect(201);

      occPostId = (res.body as ApiSuccess<PostItem>).data.id;
    });

    it('updates post successfully when matching expectedRevisionNumber: 1', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${occPostId}`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          expectedRevisionNumber: 1,
          title: 'Versioned Article Title V2',
          changeSummary: 'Updated title to V2',
        })
        .expect(200);

      const body = res.body as ApiSuccess<PostItem>;
      expect(body.data.currentRevisionNumber).toBe(2);
      expect(body.data.currentRevision?.title).toBe('Versioned Article Title V2');
    });

    it('rejects update with 409 Conflict when expectedRevisionNumber is stale (mismatched)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/posts/${occPostId}`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({
          expectedRevisionNumber: 1, // Stale! The post is now at revision 2
          title: 'Conflicting Edit Attempt',
        })
        .expect(409);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('CONFLICT');
    });

    it('lists revision history with newest revision first', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/posts/${occPostId}/revisions`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const body = res.body as ApiSuccess<PostRevisionItem[]>;
      expect(body.data).toHaveLength(2);
      expect(body.data[0]?.revisionNumber).toBe(2);
      expect(body.data[1]?.revisionNumber).toBe(1);
    });

    it('fetches exact snapshot details for Revision 1', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/posts/${occPostId}/revisions/1`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const body = res.body as ApiSuccess<PostRevisionItem>;
      expect(body.data.revisionNumber).toBe(1);
      expect(body.data.title).toBe('Versioned Article Title V1');
    });

    it('restores historical Revision 1 by creating Revision 3 without modifying past snapshots', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/posts/${occPostId}/revisions/1/restore`)
        .set('Cookie', superAdminCookie)
        .set('x-csrf-token', superAdminCsrf)
        .send({ changeSummary: 'Rolling back to V1 contents' })
        .expect(201);

      const body = res.body as ApiSuccess<PostRevisionItem>;
      expect(body.data.revisionNumber).toBe(3);
      expect(body.data.title).toBe('Versioned Article Title V1');

      // Verify post now reflects revision 3
      const postRes = await request(app.getHttpServer())
        .get(`/api/v1/posts/${occPostId}`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const postBody = postRes.body as ApiSuccess<PostItem>;
      expect(postBody.data.currentRevisionNumber).toBe(3);
      expect(postBody.data.currentRevision?.title).toBe('Versioned Article Title V1');
    });

    it('lists posts with the latest revision and a safe author summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/posts?limit=100')
        .set('Cookie', superAdminCookie)
        .expect(200);

      const items = (res.body as ApiSuccess<{ items: PostItem[] }>).data.items;
      const occPost = items.find((item) => item.id === occPostId);
      // Batched latest-revision lookup must still pick the newest revision.
      expect(occPost?.currentRevisionNumber).toBe(3);
      expect(occPost?.author?.id).toBe(occPost?.authorId);
      expect(occPost?.author?.displayName).toEqual(expect.any(String));

      // Only id and displayName: no email, hash, or status of the author.
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('password_hash');
      expect(Object.keys(occPost?.author ?? {}).sort()).toEqual(['displayName', 'id']);
    });
  });

  describe('4. Hierarchical Taxonomy (Categories & Tags) & Circular Reference Protection', () => {
    let parentCategoryId: string;
    let childCategoryId: string;
    let tagId: string;
    let testPubId: string;

    it('creates a parent category on Travel Blog', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/categories`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          name: 'Destinations',
          slug: 'destinations',
          description: 'Global travel destinations',
        })
        .expect(201);

      const body = res.body as ApiSuccess<CategoryItem>;
      expect(body.data.name).toBe('Destinations');
      expect(body.data.siteId).toBe(siteTravelId);
      expect(body.data.parentId).toBeNull();
      parentCategoryId = body.data.id;
    });

    it('creates a child category "Asia" nested under "Destinations"', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/categories`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          name: 'Asia',
          slug: 'asia',
          parentId: parentCategoryId,
          displayOrder: 1,
        })
        .expect(201);

      const body = res.body as ApiSuccess<CategoryItem>;
      expect(body.data.name).toBe('Asia');
      expect(body.data.parentId).toBe(parentCategoryId);
      childCategoryId = body.data.id;
    });

    it('prevents circular parent loop (setting Destinations parent to Asia) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/categories/${parentCategoryId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          parentId: childCategoryId, // Cycle!
        })
        .expect(400);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates a site tag "adventure-travel"', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteTravelId}/tags`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          name: 'Adventure Travel',
          slug: 'adventure-travel',
          description: 'Thrilling off-grid adventures',
        })
        .expect(201);

      const body = res.body as ApiSuccess<TagItem>;
      expect(body.data.name).toBe('Adventure Travel');
      expect(body.data.siteId).toBe(siteTravelId);
      tagId = body.data.id;
    });

    it('attaches category and tag to an existing publication', async () => {
      // Create post and publication for testing
      const postRes = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          title: 'Hiking in Nepal',
          type: 'article',
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nepal trails.' }] }],
          },
          publications: [
            {
              siteId: siteTravelId,
              slug: 'hiking-nepal',
            },
          ],
        })
        .expect(201);

      const post = (postRes.body as ApiSuccess<PostItem>).data;
      testPubId = post.publications?.[0]?.id ?? '';

      // Update publication to attach category and tag
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/publications/${testPubId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          categoryIds: [childCategoryId],
          tagIds: [tagId],
        })
        .expect(200);

      const pub = (updateRes.body as ApiSuccess<PostPublicationItem>).data;
      expect(pub.categoryIds).toContain(childCategoryId);
      expect(pub.tagIds).toContain(tagId);

      // The editor reads categories back from the post detail (regression:
      // they were missing, so the edit form always showed none selected).
      const detailRes = await request(app.getHttpServer())
        .get(`/api/v1/posts/${post.id}`)
        .set('Cookie', travelAdminCookie)
        .expect(200);
      const detailPub = (detailRes.body as ApiSuccess<PostItem>).data.publications?.find(
        (p) => p.id === testPubId,
      );
      expect(detailPub?.categoryIds).toEqual([childCategoryId]);
    });

    it('refuses to delete a category or tag that a publication uses, with 409 (not 500)', async () => {
      const del = (path: string) =>
        request(app.getHttpServer())
          .delete(`/api/v1/sites/${siteTravelId}/${path}`)
          .set('Cookie', travelAdminCookie)
          .set('x-csrf-token', travelAdminCsrf);

      const tagRes = await del(`tags/${tagId}`).expect(409);
      expect((tagRes.body as ApiErrorResponse).error.code).toBe('CONFLICT');
      const catRes = await del(`categories/${childCategoryId}`).expect(409);
      expect((catRes.body as ApiErrorResponse).error.message).toMatch(/used by published content/);
    });
  });

  describe('5. Media Metadata Foundation & Active Usage Deletion Protection', () => {
    let mediaId: string;
    let pubId: string;

    it('registers media asset metadata for Travel Blog', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          siteId: siteTravelId,
          originalFilename: 'annapurna-sunrise.jpg',
          mimeType: 'image/jpeg',
          byteSize: 1048576,
          width: 1920,
          height: 1080,
          altText: 'Sunrise over snow-capped Annapurna peaks',
          caption: 'Early morning light on the summit',
        })
        .expect(201);

      const body = res.body as ApiSuccess<MediaAssetItem>;
      expect(body.data.id).toBeDefined();
      expect(body.data.siteId).toBe(siteTravelId);
      expect(body.data.mimeType).toBe('image/jpeg');
      expect(body.data.status).toBe('active');
      mediaId = body.data.id;
    });

    it('rejects unsupported media MIME type with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          siteId: siteTravelId,
          originalFilename: 'script.exe',
          mimeType: 'application/x-msdownload',
          byteSize: 4096,
        })
        .expect(400);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('attaches media as featured image on a publication', async () => {
      // Create post with publication
      const postRes = await request(app.getHttpServer())
        .post('/api/v1/posts')
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          title: 'Dawn on the Peaks',
          type: 'article',
          body: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Stunning vistas.' }] }],
          },
          publications: [
            {
              siteId: siteTravelId,
              slug: 'dawn-on-peaks',
              featuredImageId: mediaId,
            },
          ],
        })
        .expect(201);

      pubId = (postRes.body as ApiSuccess<PostItem>).data.publications?.[0]?.id ?? '';
    });

    it('blocks deletion of media asset currently used as featured image with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/media/${mediaId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .expect(400);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('allows soft-deletion of media asset once featured image reference is removed', async () => {
      // Remove featuredImageId from publication
      await request(app.getHttpServer())
        .patch(`/api/v1/sites/${siteTravelId}/publications/${pubId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({ featuredImageId: null })
        .expect(200);

      // Soft delete media
      await request(app.getHttpServer())
        .delete(`/api/v1/media/${mediaId}`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .expect(204);

      // Verify media is no longer retrievable
      await request(app.getHttpServer())
        .get(`/api/v1/media/${mediaId}`)
        .set('Cookie', travelAdminCookie)
        .expect(404);
    });
  });

  describe('6. Cross-Tenant Authorization & IDOR Protection', () => {
    it('returns 404 NOT FOUND when Travel Admin tries to create category on Air Sports site', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/sites/${siteAirSportsId}/categories`)
        .set('Cookie', travelAdminCookie)
        .set('x-csrf-token', travelAdminCsrf)
        .send({
          name: 'Unauthorized Category',
          slug: 'unauthorized-cat',
        })
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT FOUND when Travel Admin attempts to list publications on Air Sports site', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}/publications`)
        .set('Cookie', travelAdminCookie)
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT FOUND when Air Sports Admin attempts to list publications on Travel Blog', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}/publications`)
        .set('Cookie', airSportsAdminCookie)
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('allows Super Admin to view and manage resources across both sites', async () => {
      const resTravel = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteTravelId}/categories`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      const resAir = await request(app.getHttpServer())
        .get(`/api/v1/sites/${siteAirSportsId}/categories`)
        .set('Cookie', superAdminCookie)
        .expect(200);

      expect((resTravel.body as ApiSuccess<unknown>).data).toBeDefined();
      expect((resAir.body as ApiSuccess<unknown>).data).toBeDefined();
    });
  });

  describe('7. Bilingual Localization Verification', () => {
    it('returns localized Bengali error message when requested with Accept-Language: bn', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/posts/a0000000-0000-4000-8000-000000000000')
        .set('Cookie', superAdminCookie)
        .set('Accept-Language', 'bn')
        .expect(404);

      const body = res.body as ApiErrorResponse;
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('পোস্টটি পাওয়া যায়নি।');
    });
  });
});
