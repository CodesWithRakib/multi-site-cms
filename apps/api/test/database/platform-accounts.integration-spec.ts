import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { MediaAsset } from '../../src/database/entities/media-asset.entity';
import { PostPublication } from '../../src/database/entities/post-publication.entity';
import { PostRevision } from '../../src/database/entities/post-revision.entity';
import { Post } from '../../src/database/entities/post.entity';
import { Site } from '../../src/database/entities/site.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { ensurePlatformVocabulary } from '../../src/database/platform-vocabulary';
import { applyPlatformAccounts } from '../../src/database/seeds/platform-accounts';
import { createTestDataSource, resetTestSchema } from './test-database';

describe('applyPlatformAccounts', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);
    await ensurePlatformVocabulary(dataSource);

    const sites = dataSource.getRepository(Site);
    const travel = await sites.save({
      key: 'travel-blog',
      name: 'Travel',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });
    await sites.save({
      key: 'air-sports',
      name: 'Air',
      defaultLocale: 'en',
      timezone: 'UTC',
      status: 'active',
      settings: {},
    });

    const old = await dataSource
      .getRepository(User)
      .save({ email: 'old@example.test', displayName: 'Old', passwordHash: 'x', status: 'active' });
    const post = await dataSource
      .getRepository(Post)
      .save({ authorId: old.id, type: 'article', status: 'approved', sourceLocale: 'en' });
    const revision = await dataSource.getRepository(PostRevision).save({
      postId: post.id,
      revisionNumber: 1,
      title: 'Old post',
      body: { type: 'doc', content: [] },
      createdBy: old.id,
    });
    await dataSource.getRepository(PostPublication).save({
      siteId: travel.id,
      postId: post.id,
      revisionId: revision.id,
      slug: 'old-post',
      status: 'published',
      publishedAt: new Date(),
    });
    await dataSource.query(
      `INSERT INTO "audit_events" ("actor_id", "actor_type", "action", "entity_type")
       VALUES ($1, 'user', 'post.create', 'post')`,
      [old.id],
    );
    await dataSource.getRepository(MediaAsset).save({
      siteId: travel.id,
      uploadedBy: old.id,
      storageKey: 'kept.jpg',
      mimeType: 'image/jpeg',
      byteSize: '10',
      checksum: 'a'.repeat(64),
    });
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it('leaves exactly the two accounts, purges posts and keeps media', async () => {
    const report = await dataSource.transaction((manager) =>
      applyPlatformAccounts(manager, {
        superAdmin: { email: 'Owner@Example.test', displayName: 'Owner', passwordHash: 'h1' },
        clientAdmin: { email: 'client@example.test', displayName: 'Client', passwordHash: 'h2' },
        clientSiteKeys: ['travel-blog', 'air-sports'],
        purgePosts: true,
        removeOtherUsers: true,
      }),
    );

    expect(report.postsDeleted).toBe(1);
    expect(report.usersRemoved).toEqual(['old@example.test']);

    const users = await dataSource.getRepository(User).find({ order: { email: 'ASC' } });
    expect(users.map((u) => u.email)).toEqual(['client@example.test', 'owner@example.test']);
    expect(await dataSource.getRepository(Post).count()).toBe(0);
    expect(await dataSource.getRepository(PostPublication).count()).toBe(0);
    expect(await dataSource.getRepository(MediaAsset).count()).toBe(1);

    // Audit history survives with the removed actor recorded.
    const history = await dataSource.query<{ actor_type: string; removed: string }[]>(
      `SELECT "actor_type", "metadata"->>'removedActor' AS "removed" FROM "audit_events"
        WHERE "action" = 'post.create'`,
    );
    expect(history).toEqual([{ actor_type: 'system', removed: 'old@example.test' }]);

    const roles = await dataSource.query<{ email: string; key: string; site: string | null }[]>(
      `SELECT u."email", r."key", s."key" AS "site" FROM "user_role_assignments" a
         JOIN "users" u ON u."id" = a."user_id" JOIN "roles" r ON r."id" = a."role_id"
         LEFT JOIN "sites" s ON s."id" = a."site_id" ORDER BY u."email", s."key"`,
    );
    expect(roles).toEqual([
      { email: 'client@example.test', key: 'admin', site: 'air-sports' },
      { email: 'client@example.test', key: 'admin', site: 'travel-blog' },
      { email: 'owner@example.test', key: 'super_admin', site: null },
    ]);
  });

  it('is idempotent and never needs a password for existing accounts', async () => {
    await dataSource.transaction((manager) =>
      applyPlatformAccounts(manager, {
        superAdmin: { email: 'owner@example.test', displayName: 'Owner', passwordHash: null },
        clientAdmin: { email: 'client@example.test', displayName: 'Client', passwordHash: null },
        clientSiteKeys: ['travel-blog', 'air-sports'],
        purgePosts: false,
        removeOtherUsers: true,
      }),
    );
    expect(await dataSource.getRepository(UserRoleAssignment).count()).toBe(3);
    const owner = await dataSource
      .getRepository(User)
      .findOneOrFail({ where: { email: 'owner@example.test' }, select: { passwordHash: true } });
    expect(owner.passwordHash).toBe('h1');
  });
});
