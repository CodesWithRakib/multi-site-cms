import { Readable } from 'node:stream';

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { ensurePlatformVocabulary } from '../../src/database/platform-vocabulary';
import { PRODUCTION_SITES } from '../../src/database/seeds/production/bangladesh-content';
import { seedProductionContent } from '../../src/database/seeds/production/seed-production-content';
import type { StorageProvider } from '../../src/media/storage/storage-provider.interface';
import { validateStructuredBody } from '../../src/posts/utils/body-validator';
import { createTestDataSource, resetTestSchema } from './test-database';

/** In-memory storage: records uploads instead of calling Cloudinary. */
class MemoryStorage implements StorageProvider {
  readonly name = 'memory';
  readonly files = new Map<string, Buffer>();
  async upload(key: string, buffer: Buffer) {
    this.files.set(key, buffer);
    return { key, byteSize: buffer.byteLength, checksum: 'x'.repeat(64) };
  }
  async delete(key: string) {
    this.files.delete(key);
  }
  async getStream(key: string) {
    return Readable.from(this.files.get(key) ?? Buffer.alloc(0));
  }
  async exists(key: string) {
    return this.files.has(key);
  }
  getUrl(key: string) {
    return `memory://${key}`;
  }
}

let dataSource: DataSource;
let authorId: string;
const siteUrls = {
  'travel-blog': 'https://shomik-travel-blog.vercel.app',
  'air-sports': 'https://shomik-air-sports.vercel.app',
};
const totalArticles = PRODUCTION_SITES.reduce((n, site) => n + site.articles.length, 0);

const count = async (sql: string): Promise<number> => {
  const rows = (await dataSource.query(sql)) as Array<{ n: number }>;
  return Number(rows[0]?.n ?? 0);
};

beforeAll(async () => {
  dataSource = await createTestDataSource();
  await resetTestSchema(dataSource);
  await ensurePlatformVocabulary(dataSource);
  const rows = (await dataSource.query(
    `INSERT INTO "users" ("email", "display_name", "status")
     VALUES ('owner@example.test', 'Owner', 'active') RETURNING "id"`,
  )) as Array<{ id: string }>;
  authorId = rows[0]?.id ?? '';
}, 60_000);

afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
});

describe('launch content data', () => {
  it('has valid bodies, unique slugs, and known categories and tags', () => {
    for (const site of PRODUCTION_SITES) {
      const slugs = site.articles.map((a) => a.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const article of site.articles) {
        expect(validateStructuredBody(article.body)).toEqual({ isValid: true });
        expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(site.categories.map((c) => c.slug)).toContain(article.category);
        for (const tag of article.tags) expect(site.tags.map((t) => t.slug)).toContain(tag);
        expect(article.excerpt.length).toBeLessThanOrEqual(300);
      }
    }
  });
});

describe('seedProductionContent', () => {
  it('creates sites, verified domains, and published articles with covers, idempotently', async () => {
    const storage = new MemoryStorage();
    const options = { sites: PRODUCTION_SITES, siteUrls, authorId, storage };

    const first = await seedProductionContent(dataSource, options);
    expect([...first.sitesCreated].sort()).toEqual(['air-sports', 'travel-blog']);
    expect([...first.domainsAdded].sort()).toEqual([
      'shomik-air-sports.vercel.app',
      'shomik-travel-blog.vercel.app',
    ]);
    expect(first.articlesCreated).toHaveLength(totalArticles);
    expect(storage.files.size).toBe(totalArticles);

    expect(
      await count(
        `SELECT COUNT(*)::int AS n FROM site_domains WHERE is_primary AND verified_at IS NOT NULL`,
      ),
    ).toBe(2);
    expect(
      await count(
        `SELECT COUNT(*)::int AS n FROM post_publications
         WHERE status = 'published' AND featured_image_id IS NOT NULL`,
      ),
    ).toBe(totalArticles);
    expect(await count(`SELECT COUNT(*)::int AS n FROM post_publication_categories`)).toBe(
      totalArticles,
    );

    const second = await seedProductionContent(dataSource, options);
    expect(second.articlesCreated).toHaveLength(0);
    expect(second.articlesSkipped).toHaveLength(totalArticles);
    expect(second.sitesCreated).toHaveLength(0);
    expect(await count(`SELECT COUNT(*)::int AS n FROM posts`)).toBe(totalArticles);
  });
});
