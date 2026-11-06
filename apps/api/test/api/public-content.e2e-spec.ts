import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type {
  ApiSuccess,
  PublicArticleDetail,
  PublicArticleSummary,
  PublicCategoryItem,
  PublicEventDetail,
  PublicEventSummary,
  PublicSitemapItem,
  PublicTagItem,
  PublicCommentsResult,
  SubmittedPublicComment,
} from '@multi-site-cms/types';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import type { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { AuthorizationService } from '../../src/auth/services/authorization.service';
import { PasswordService } from '../../src/auth/services/password.service';
import { configureApp } from '../../src/bootstrap';
import { Category } from '../../src/database/entities/category.entity';
import { Event } from '../../src/database/entities/event.entity';
import { PostComment } from '../../src/database/entities/post-comment.entity';
import { PostPublicationCategory } from '../../src/database/entities/post-publication-category.entity';
import { PostPublicationTag } from '../../src/database/entities/post-publication-tag.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { Role } from '../../src/database/entities/role.entity';
import { Site } from '../../src/database/entities/site.entity';
import { Tag } from '../../src/database/entities/tag.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { PostsService } from '../../src/posts/posts.service';
import { PublicContentService } from '../../src/posts/public-content.service';
import { createTestDataSource, resetTestSchema } from '../database/test-database';

describe('Public Content Discovery API (/api/v1/public/sites/:siteKey/*)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let passwordService: PasswordService;
  let postsService: PostsService;

  let siteTravelId: string;
  let siteAirSportsId: string;
  let authorUserId: string;

  let _publishedPost1Id: string;
  let _publishedPost2Id: string;
  let draftPostId: string;
  let _airSportsPostId: string;

  let categoryAdventureId: string;
  let categoryCultureId: string;
  let tagEuropeId: string;

  let previewToken: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    passwordService = new PasswordService();

    // 1. Seed Roles and Super Admin User
    const roleRepo = dataSource.getRepository(Role);
    const superAdminRole = await roleRepo.save({
      key: 'super_admin',
      name: 'Super Admin',
      scopeType: 'platform',
    });

    const userRepo = dataSource.getRepository(User);
    const authorUser = await userRepo.save({
      email: 'travel-editor@platform.local',
      displayName: 'Elena Rostova',
      passwordHash: await passwordService.hash('EditorPassword123!'),
      status: 'active',
    });
    authorUserId = authorUser.id;

    const uraRepo = dataSource.getRepository(UserRoleAssignment);
    await uraRepo.save({
      userId: authorUser.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
    });

    // 2. Seed Sites
    const siteRepo = dataSource.getRepository(Site);
    const travelSite = await siteRepo.save({
      key: 'travel-blog',
      name: 'Wanderlust Chronicles',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteTravelId = travelSite.id;

    const airSportsSite = await siteRepo.save({
      key: 'air-sports',
      name: 'SkyPulse Live Updates',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    siteAirSportsId = airSportsSite.id;

    // 3. Seed Taxonomies
    const catRepo = dataSource.getRepository(Category);
    const catAdventure = await catRepo.save({
      siteId: siteTravelId,
      name: 'Adventure Escapes',
      slug: 'adventure-escapes',
      description: 'Mountain treks and wilderness routes',
    });
    categoryAdventureId = catAdventure.id;

    const catCulture = await catRepo.save({
      siteId: siteTravelId,
      name: 'Cultural Heritage',
      slug: 'cultural-heritage',
      description: 'Ancient monuments and local living arts',
    });
    categoryCultureId = catCulture.id;

    const tagRepo = dataSource.getRepository(Tag);
    const tagEurope = await tagRepo.save({
      siteId: siteTravelId,
      name: 'Europe',
      slug: 'europe',
      description: 'European destinations',
    });
    tagEuropeId = tagEurope.id;

    // 4. Seed Posts, Revisions, and Publications
    const postRepo = dataSource.getRepository(Post);
    const revRepo = dataSource.getRepository(PostRevision);
    const pubRepo = dataSource.getRepository(PostPublication);
    const ppcRepo = dataSource.getRepository(PostPublicationCategory);
    const pptRepo = dataSource.getRepository(PostPublicationTag);

    // Published Article 1 (Travel Blog)
    const post1 = await postRepo.save({
      authorId: authorUserId,
      type: 'article',
      status: 'approved',
      sourceLocale: 'en',
    });
    _publishedPost1Id = post1.id;

    const rev1 = await revRepo.save({
      postId: post1.id,
      revisionNumber: 1,
      title: 'Hidden Fjords of Norway: A Winter Odyssey',
      excerpt: 'Sailing through majestic icy fjords under Arctic northern lights.',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Norway in winter offers unearthly crystalline beauty.' },
            ],
          },
        ],
      },
      createdBy: authorUserId,
    });

    const pub1 = await pubRepo.save({
      siteId: siteTravelId,
      postId: post1.id,
      revisionId: rev1.id,
      slug: 'hidden-fjords-norway',
      status: 'published',
      publishedAt: new Date(Date.now() - 3600 * 1000 * 24), // 1 day ago
      seoTitle: 'Hidden Fjords of Norway Travel Guide',
      seoDescription: 'Comprehensive guide to exploring Arctic Norway in winter.',
    });

    await ppcRepo.save({
      publicationId: pub1.id,
      categoryId: categoryAdventureId,
      siteId: siteTravelId,
    });

    await pptRepo.save({
      publicationId: pub1.id,
      tagId: tagEuropeId,
      siteId: siteTravelId,
    });

    // Published Travel Guide 2 (Travel Blog)
    const post2 = await postRepo.save({
      authorId: authorUserId,
      type: 'travel_guide',
      status: 'approved',
      sourceLocale: 'en',
    });
    _publishedPost2Id = post2.id;

    const rev2 = await revRepo.save({
      postId: post2.id,
      revisionNumber: 1,
      title: 'Kyoto Ancient Temples Walking Guide',
      excerpt: 'Explore historic Zen shrines and bamboo pathways of Arashiyama.',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Kyoto retains centuries of contemplative Japanese serenity.' },
            ],
          },
        ],
      },
      createdBy: authorUserId,
    });

    const pub2 = await pubRepo.save({
      siteId: siteTravelId,
      postId: post2.id,
      revisionId: rev2.id,
      slug: 'kyoto-temples-guide',
      status: 'published',
      publishedAt: new Date(), // Just now
      seoTitle: 'Kyoto Temples Guide 2026',
      seoDescription: 'Step by step route to Kyoto UNESCO temples.',
    });

    await ppcRepo.save({
      publicationId: pub2.id,
      categoryId: categoryCultureId,
      siteId: siteTravelId,
    });

    // Draft Post (Travel Blog - should NEVER be exposed publicly)
    const postDraft = await postRepo.save({
      authorId: authorUserId,
      type: 'article',
      status: 'draft',
      sourceLocale: 'en',
    });
    draftPostId = postDraft.id;

    const revDraft = await revRepo.save({
      postId: postDraft.id,
      revisionNumber: 1,
      title: 'Secret Draft: Unannounced Expedition',
      excerpt: 'Top secret article still in draft mode.',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Classified notes for editorial eyes only.' }],
          },
        ],
      },
      createdBy: authorUserId,
    });

    await pubRepo.save({
      siteId: siteTravelId,
      postId: postDraft.id,
      revisionId: revDraft.id,
      slug: 'secret-draft-expedition',
      status: 'draft',
      publishedAt: null,
    });

    // Air Sports Published Post (Different site - must never leak into travel-blog)
    const eventRepo = dataSource.getRepository(Event);
    const alpsEvent = await eventRepo.save({
      siteId: siteAirSportsId,
      name: 'Alps Paragliding Championship 2026',
      slug: 'alps-paragliding-2026',
      status: 'live',
      startsAt: new Date(Date.now() - 3600000),
      description: 'Annual cross-country hike & fly race through the European Alps.',
    });

    const postAir = await postRepo.save({
      authorId: authorUserId,
      type: 'live_update',
      status: 'approved',
      sourceLocale: 'en',
    });
    _airSportsPostId = postAir.id;

    const revAir = await revRepo.save({
      postId: postAir.id,
      revisionNumber: 1,
      title: 'Red Bull Air Race Round 3 Live Timing',
      excerpt: 'High speed aerobatic action from Abu Dhabi.',
      body: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Fastest lap time clocked in qualifying.' }],
          },
        ],
      },
      createdBy: authorUserId,
    });

    await pubRepo.save({
      siteId: siteAirSportsId,
      postId: postAir.id,
      revisionId: revAir.id,
      eventId: alpsEvent.id,
      slug: 'red-bull-air-race-round-3',
      status: 'published',
      templateKey: 'breaking',
      publishedAt: new Date(),
    });

    // Initialize Nest Application
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    postsService = app.get(PostsService);
    const authService = app.get(AuthorizationService);
    const actor = await authService.resolveUserAccess(authorUser);

    // Generate preview token for draft post
    const previewRes = await postsService.generatePreviewToken(actor, draftPostId, siteTravelId);
    previewToken = previewRes.token;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('GET /api/v1/public/sites/:siteKey/posts', () => {
    it('returns published articles for travel-blog with ETag and Cache-Control', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts')
        .expect(200);

      expect(res.headers['cache-control']).toBeDefined();
      expect(res.headers['etag']).toBeDefined();

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(2);
      expect(body.data.some((a) => a.slug === 'hidden-fjords-norway')).toBe(true);
      expect(body.data.some((a) => a.slug === 'kyoto-temples-guide')).toBe(true);

      // Ensures draft and air-sports posts are excluded
      expect(body.data.some((a) => a.slug === 'secret-draft-expedition')).toBe(false);
      expect(body.data.some((a) => a.slug === 'red-bull-air-race-round-3')).toBe(false);

      // ETag 304 Not Modified
      const etag = (res.headers['etag'] as string) || '';
      await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts')
        .set('If-None-Match', etag)
        .expect(304);
    });

    it('filters articles by type=travel_guide', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts?type=travel_guide')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('kyoto-temples-guide');
    });

    it('filters articles by categorySlug=adventure-escapes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts?categorySlug=adventure-escapes')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('hidden-fjords-norway');
      expect(body.data[0]?.categories.some((c) => c.slug === 'adventure-escapes')).toBe(true);
    });

    it('filters articles by tagSlug=europe', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts?tagSlug=europe')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('hidden-fjords-norway');
    });

    it('searches articles by title keyword', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts?search=Fjords')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('hidden-fjords-norway');
    });

    it('sorts by real readership with sort=popular (page views, last 30 days)', async () => {
      // The older Norway post gets the views; newest-first would list Kyoto first.
      for (let i = 0; i < 3; i++) {
        await dataSource.query(
          `INSERT INTO "analytics_page_views" ("site_id", "post_id", "path", "visitor_id")
           VALUES ($1, $2, '/articles/hidden-fjords-norway', $3)`,
          [siteTravelId, _publishedPost1Id, `visitor-${i}`],
        );
      }

      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts?sort=popular')
        .expect(200);
      const slugs = (res.body as ApiSuccess<PublicArticleSummary[]>).data.map((a) => a.slug);
      expect(slugs[0]).toBe('hidden-fjords-norway');
      expect(slugs).toContain('kyoto-temples-guide');
    });

    it('filters articles by templateKey=breaking', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/air-sports/posts?templateKey=breaking')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleSummary[]>;
      expect(body.data).toHaveLength(1);
      expect(body.data[0]?.slug).toBe('red-bull-air-race-round-3');
      expect(body.data[0]?.templateKey).toBe('breaking');
      expect(body.data[0]?.eventId).toBeDefined();
    });

    it('returns 404 for non-existent site', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/sites/non-existent-site/posts')
        .expect(404);
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/posts/:slug', () => {
    it('returns article detail with rich body, author, taxonomies, and adjacent articles', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts/hidden-fjords-norway')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleDetail>;
      expect(body.data.slug).toBe('hidden-fjords-norway');
      expect(body.data.title).toBe('Hidden Fjords of Norway: A Winter Odyssey');
      expect(body.data.author?.displayName).toBe('Elena Rostova');
      expect(body.data.body).toBeDefined();
      expect(body.data.body.type).toBe('doc');
      expect(body.data.categories.some((c) => c.slug === 'adventure-escapes')).toBe(true);
      expect(body.data.tags.some((t) => t.slug === 'europe')).toBe(true);
      expect(body.data.readingTimeMinutes).toBeGreaterThanOrEqual(1);
      expect(body.data.seoTitle).toBe('Hidden Fjords of Norway Travel Guide');
    });

    it('returns related articles with their own type, taxonomy, and author (not blanks)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts/hidden-fjords-norway')
        .expect(200);

      const body = res.body as ApiSuccess<PublicArticleDetail>;
      const kyoto = body.data.relatedArticles.find((a) => a.slug === 'kyoto-temples-guide');
      expect(kyoto).toBeDefined();
      // Regression: related items used to copy the current post's type and
      // ship empty categories/author, so cards rendered placeholder data.
      expect(kyoto?.type).toBe('travel_guide');
      expect(kyoto?.categories.some((c) => c.slug === 'cultural-heritage')).toBe(true);
      expect(kyoto?.author?.displayName).toBe('Elena Rostova');
      expect(body.data.relatedArticles.some((a) => a.slug === 'hidden-fjords-norway')).toBe(false);
    });

    it('returns opaque 404 for unpublished draft post slug', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts/secret-draft-expedition')
        .expect(404);
    });

    it('returns opaque 404 for slug belonging to another site', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/posts/red-bull-air-race-round-3')
        .expect(404);
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/categories and /tags', () => {
    it('returns public categories with published post counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/categories')
        .expect(200);

      const body = res.body as ApiSuccess<PublicCategoryItem[]>;
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      const adv = body.data.find((c) => c.slug === 'adventure-escapes');
      expect(adv).toBeDefined();
      expect(adv?.postCount).toBe(1);
    });

    it('returns public tags with published post counts', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/tags')
        .expect(200);

      const body = res.body as ApiSuccess<PublicTagItem[]>;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const europe = body.data.find((t) => t.slug === 'europe');
      expect(europe).toBeDefined();
      expect(europe?.postCount).toBe(1);
    });

    it('does not count deleted posts in category or tag totals', async () => {
      const posts = dataSource.getRepository(Post);
      await posts.update({ id: _publishedPost1Id }, { deletedAt: new Date() });
      try {
        const cats = await request(app.getHttpServer())
          .get('/api/v1/public/sites/travel-blog/categories')
          .expect(200);
        const adv = (cats.body as ApiSuccess<PublicCategoryItem[]>).data.find(
          (c) => c.slug === 'adventure-escapes',
        );
        expect(adv?.postCount).toBe(0);

        const tags = await request(app.getHttpServer())
          .get('/api/v1/public/sites/travel-blog/tags')
          .expect(200);
        const europe = (tags.body as ApiSuccess<PublicTagItem[]>).data.find(
          (t) => t.slug === 'europe',
        );
        expect(europe?.postCount).toBe(0);
      } finally {
        await posts.update({ id: _publishedPost1Id }, { deletedAt: null });
      }
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/sitemap', () => {
    it('returns published slugs and timestamps for XML sitemap generation', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/sitemap')
        .expect(200);

      const body = res.body as ApiSuccess<PublicSitemapItem[]>;
      expect(body.data).toHaveLength(2);
      expect(body.data.some((s) => s.slug === 'hidden-fjords-norway')).toBe(true);
      expect(body.data.some((s) => s.slug === 'kyoto-temples-guide')).toBe(true);
      expect(body.data.some((s) => s.slug === 'secret-draft-expedition')).toBe(false);
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/preview/:postId', () => {
    it('allows viewing draft post with valid signed HMAC token and sends noindex headers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/public/sites/travel-blog/preview/${draftPostId}?token=${previewToken}`)
        .expect(200);

      expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
      expect(res.headers['cache-control']).toContain('no-store');

      const body = res.body as ApiSuccess<PublicArticleDetail>;
      expect(body.data.title).toBe('Secret Draft: Unannounced Expedition');
      expect(body.data.body.type).toBe('doc');
    });

    it('rejects tampered or forged preview token with 401', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/public/sites/travel-blog/preview/${draftPostId}?token=invalid-token`)
        .expect(401);
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/events', () => {
    it('returns published events with update count for air-sports', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/air-sports/events')
        .expect(200);

      const body = res.body as ApiSuccess<PublicEventSummary[]>;
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      const alps = body.data.find((e) => e.slug === 'alps-paragliding-2026');
      expect(alps).toBeDefined();
      expect(alps?.status).toBe('live');
      expect(alps?.updateCount).toBe(1);
    });

    it('returns empty array when site has no events', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/travel-blog/events')
        .expect(200);

      const body = res.body as ApiSuccess<PublicEventSummary[]>;
      expect(body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/public/sites/:siteKey/events/:slug', () => {
    it('returns event detail with its timeline of published updates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/public/sites/air-sports/events/alps-paragliding-2026')
        .expect(200);

      const body = res.body as ApiSuccess<PublicEventDetail>;
      expect(body.data.slug).toBe('alps-paragliding-2026');
      expect(body.data.name).toBe('Alps Paragliding Championship 2026');
      expect(body.data.status).toBe('live');
      expect(body.data.updates).toHaveLength(1);
      expect(body.data.updates[0]?.slug).toBe('red-bull-air-race-round-3');
    });

    it('returns 404 for non-existent event slug', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/public/sites/air-sports/events/non-existent-event-slug')
        .expect(404);
    });
  });

  describe('Public comments (pre-moderated)', () => {
    const commentsPath = '/api/v1/public/sites/travel-blog/posts/hidden-fjords-norway/comments';

    async function listComments(): Promise<PublicCommentsResult> {
      const res = await request(app.getHttpServer()).get(commentsPath).expect(200);
      return (res.body as ApiSuccess<PublicCommentsResult>).data;
    }

    it('stores a new comment as pending and keeps it out of the public list', async () => {
      const res = await request(app.getHttpServer())
        .post(commentsPath)
        .send({
          authorName: 'Reader One',
          authorEmail: 'reader.one@example.com',
          content: 'The fjord ferry tip saved our trip.',
          rating: 5,
        })
        .expect(201);

      const created = (res.body as ApiSuccess<SubmittedPublicComment>).data;
      expect(created.status).toBe('pending');

      const stored = await dataSource
        .getRepository(PostComment)
        .findOneByOrFail({ id: created.id });
      expect(stored.status).toBe('pending');
      expect(stored.siteId).toBe(siteTravelId);

      const list = await listComments();
      expect(list.items.some((item) => item.id === created.id)).toBe(false);
    });

    it('answers a honeypot submission like a normal one but stores it as spam', async () => {
      const res = await request(app.getHttpServer())
        .post(commentsPath)
        .send({
          authorName: 'Bot',
          authorEmail: 'bot@example.com',
          content: 'Buy now',
          website_url: 'https://spam.example.com',
        })
        .expect(201);

      const created = (res.body as ApiSuccess<SubmittedPublicComment>).data;
      expect(created.status).toBe('pending');

      const stored = await dataSource
        .getRepository(PostComment)
        .findOneByOrFail({ id: created.id });
      expect(stored.status).toBe('spam');
    });

    it('lists a comment only after it is approved', async () => {
      const res = await request(app.getHttpServer())
        .post(commentsPath)
        .send({
          authorName: 'Reader Two',
          authorEmail: 'reader.two@example.com',
          content: 'Great photos of Geirangerfjord.',
        })
        .expect(201);
      const created = (res.body as ApiSuccess<SubmittedPublicComment>).data;

      await dataSource
        .getRepository(PostComment)
        .update({ id: created.id }, { status: 'approved' });

      const list = await listComments();
      expect(list.items.some((item) => item.id === created.id)).toBe(true);
    });

    it('rejects a comment whose site does not match its publication (composite FK)', async () => {
      const publication = await dataSource
        .getRepository(PostPublication)
        .findOneByOrFail({ siteId: siteTravelId, slug: 'hidden-fjords-norway' });

      await expect(
        dataSource.getRepository(PostComment).insert({
          siteId: siteAirSportsId,
          publicationId: publication.id,
          authorName: 'Cross Site',
          authorEmail: 'cross@example.com',
          content: 'Should not be stored.',
        }),
      ).rejects.toThrow(/FK_post_comments_publication_site/);
    });
  });

  describe('POST /api/v1/public/sites/:siteKey/newsletter', () => {
    // The route allows five requests per minute per client; these tests send
    // exactly five, then prove the sixth is refused.
    const subscribe = (siteKey: string, email: unknown) =>
      request(app.getHttpServer())
        .post(`/api/v1/public/sites/${siteKey}/newsletter`)
        .send({ email });

    const subscribersOf = (siteId: string) =>
      dataSource.query(
        `SELECT "email", "status" FROM "newsletter_subscribers" WHERE "site_id" = $1 ORDER BY "email"`,
        [siteId],
      ) as Promise<Array<{ email: string; status: string }>>;

    it('subscribes with a message naming the site, normalizing the address', async () => {
      const res = await subscribe('air-sports', '  Pilot@Example.COM ').expect(200);
      expect((res.body as ApiSuccess<{ message: string }>).data).toEqual({
        subscribed: true,
        message: 'Thank you for subscribing to SkyPulse Live Updates!',
      });
      expect(await subscribersOf(siteAirSportsId)).toEqual([
        { email: 'pilot@example.com', status: 'subscribed' },
      ]);
    });

    it('answers a repeat subscription identically and keeps one row', async () => {
      const res = await subscribe('air-sports', 'pilot@example.com').expect(200);
      expect((res.body as ApiSuccess<{ subscribed: boolean }>).data.subscribed).toBe(true);
      expect(await subscribersOf(siteAirSportsId)).toHaveLength(1);
    });

    it('keeps lists separate per site', async () => {
      const res = await subscribe('travel-blog', 'pilot@example.com').expect(200);
      expect((res.body as ApiSuccess<{ message: string }>).data.message).toContain(
        'Wanderlust Chronicles',
      );
      expect(await subscribersOf(siteTravelId)).toHaveLength(1);
    });

    it('rejects an invalid address and an unknown site', async () => {
      await subscribe('travel-blog', 'not-an-email').expect(400);
      await subscribe('no-such-site', 'reader@example.com').expect(404);
    });

    it('throttles the sixth request within a minute', async () => {
      await subscribe('travel-blog', 'late@example.com').expect(429);
    });

    it('never writes the address into the audit log', async () => {
      const rows = (await dataSource.query(
        `SELECT "metadata" FROM "audit_events" WHERE "action" = 'newsletter.subscribed'`,
      )) as Array<{ metadata: Record<string, unknown> }>;
      expect(rows.length).toBeGreaterThan(0);
      expect(JSON.stringify(rows)).not.toContain('pilot@example.com');
    });

    it('stays consistent under concurrent identical subscriptions', async () => {
      const service = app.get(PublicContentService);
      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          service.subscribeNewsletter('travel-blog', { email: 'race@example.com' }),
        ),
      );
      expect(results.every((result) => result.subscribed)).toBe(true);
      const rows = (await subscribersOf(siteTravelId)).filter(
        (row) => row.email === 'race@example.com',
      );
      expect(rows).toHaveLength(1);
    });
  });
});
