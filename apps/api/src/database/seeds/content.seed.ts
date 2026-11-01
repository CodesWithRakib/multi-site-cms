import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';

export async function seedContentData(dataSource: DataSource): Promise<void> {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed production database.');
  }

  // 1. Get Super Admin user ID
  const users: Array<{ id: string }> = await dataSource.query(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`,
  );
  const firstUser = users[0];
  if (!firstUser) {
    console.log('No user found to assign as content author. Bootstrap a user first.');
    return;
  }
  const authorId = firstUser.id;

  // 2. Get Site IDs
  const sites: Array<{ id: string; key: string; name: string }> = await dataSource.query(
    `SELECT id, key, name FROM sites WHERE key IN ('travel-blog', 'air-sports')`,
  );
  const travelSite = sites.find((s) => s.key === 'travel-blog');
  const airSportsSite = sites.find((s) => s.key === 'air-sports');

  if (!travelSite || !airSportsSite) {
    console.log('Required sites (travel-blog, air-sports) missing. Run development seed first.');
    return;
  }

  // Check if content already exists
  const existingCount: Array<{ count: string }> = await dataSource.query(
    `SELECT count(*)::text as count FROM posts WHERE deleted_at IS NULL`,
  );
  if (Number.parseInt(existingCount[0]?.count || '0', 10) >= 5) {
    console.log('Content seed already present, skipping.');
    return;
  }

  console.log('Seeding realistic publication content and audit logs...');

  // Helper to create post, revision, and publication
  const createItem = async (options: {
    siteId: string;
    siteName: string;
    type: 'article' | 'travel_guide' | 'air_sports_update';
    title: string;
    slug: string;
    excerpt: string;
    status: 'draft' | 'scheduled' | 'published' | 'archived';
    scheduledFor?: Date | null;
    publishedAt?: Date | null;
    createdDaysAgo: number;
  }) => {
    const createdAt = new Date(Date.now() - options.createdDaysAgo * 86400 * 1000);
    const updatedAt = new Date(createdAt.getTime() + 3600 * 1000);

    // 1. Insert Post
    const postRes: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO posts (author_id, type, status, source_locale, created_at, updated_at)
       VALUES ($1, $2, $3, 'en', $4, $5)
       RETURNING id`,
      [
        authorId,
        options.type,
        options.status === 'published' ? 'approved' : 'draft',
        createdAt,
        updatedAt,
      ],
    );
    const postRecord = postRes[0];
    if (!postRecord) throw new Error('Failed to insert post.');
    const postId = postRecord.id;

    // 2. Insert Revision
    const bodyDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: options.excerpt }],
        },
      ],
    };

    const revRes: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO post_revisions (post_id, revision_number, title, excerpt, body, created_by, created_at)
       VALUES ($1, 1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [postId, options.title, options.excerpt, bodyDoc, authorId, createdAt],
    );
    const revRecord = revRes[0];
    if (!revRecord) throw new Error('Failed to insert revision.');
    const revisionId = revRecord.id;

    // 3. Insert Publication
    await dataSource.query(
      `INSERT INTO post_publications (
         site_id, post_id, revision_id, slug, status,
         scheduled_for, published_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        options.siteId,
        postId,
        revisionId,
        options.slug,
        options.status,
        options.scheduledFor ?? null,
        options.publishedAt ?? (options.status === 'published' ? createdAt : null),
        createdAt,
        updatedAt,
      ],
    );

    // 4. Insert Audit Log
    const action =
      options.status === 'published'
        ? 'publication.publish'
        : options.status === 'scheduled'
          ? 'publication.schedule'
          : 'post.create';

    await dataSource.query(
      `INSERT INTO audit_events (
         actor_id, actor_type, site_id, action, entity_type, entity_id, created_at, metadata
       ) VALUES ($1, 'user', $2, $3, 'post_publication', $4, $5, $6)`,
      [
        authorId,
        options.siteId,
        action,
        postId,
        updatedAt,
        JSON.stringify({ title: options.title, slug: options.slug, siteName: options.siteName }),
      ],
    );
  };

  // Travel Blog Items
  await createItem({
    siteId: travelSite.id,
    siteName: travelSite.name,
    type: 'travel_guide',
    title: 'Hidden Temples of Chiang Mai: A 7-Day Northern Thailand Itinerary',
    slug: 'hidden-temples-chiang-mai',
    excerpt:
      'Explore ancient forest wats, sacred mountain sanctuaries, and local night bazaars across northern Thailand.',
    status: 'published',
    createdDaysAgo: 12,
  });

  await createItem({
    siteId: travelSite.id,
    siteName: travelSite.name,
    type: 'article',
    title: 'Sustainable Travel: How to Minimize Your Carbon Footprint Across Europe',
    slug: 'sustainable-travel-europe',
    excerpt:
      'Practical guide to high-speed rail corridors, eco-certified alpine lodges, and low-impact journeys.',
    status: 'published',
    createdDaysAgo: 5,
  });

  await createItem({
    siteId: travelSite.id,
    siteName: travelSite.name,
    type: 'article',
    title: 'The Culinary Heritage of Oaxaca: Mole, Markets, and Mezcal',
    slug: 'culinary-heritage-oaxaca',
    excerpt:
      'A deep dive into traditional Mexican culinary craftsmanship in the central valleys of Oaxaca.',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 4 * 86400 * 1000),
    createdDaysAgo: 2,
  });

  await createItem({
    siteId: travelSite.id,
    siteName: travelSite.name,
    type: 'travel_guide',
    title: 'Winter in Hokkaido: Powder Snow, Onsens, and Sapporo Cuisine',
    slug: 'winter-in-hokkaido',
    excerpt:
      'Experience world-class backcountry powder, volcanic hot springs, and regional seafood specialties.',
    status: 'draft',
    createdDaysAgo: 1,
  });

  await createItem({
    siteId: travelSite.id,
    siteName: travelSite.name,
    type: 'article',
    title: 'Sailing the Dalmatian Coast: Croatia Island Hopping Guide',
    slug: 'sailing-dalmatian-coast',
    excerpt:
      'Navigating the Adriatic waters from Split to Dubrovnik with hidden coves and historic ports.',
    status: 'archived',
    createdDaysAgo: 25,
  });

  // Air Sports Items
  await createItem({
    siteId: airSportsSite.id,
    siteName: airSportsSite.name,
    type: 'air_sports_update',
    title: 'World Wingsuit Championship 2026: Proximity Flying Finals in Switzerland',
    slug: 'world-wingsuit-championship-2026',
    excerpt:
      'Final round telemetry, wind shear analysis, and official podium standings from the Swiss Alps.',
    status: 'published',
    createdDaysAgo: 8,
  });

  await createItem({
    siteId: airSportsSite.id,
    siteName: airSportsSite.name,
    type: 'article',
    title: 'Red Bull Air Race Returns: New High-G Aircraft Specifications Announced',
    slug: 'red-bull-air-race-specifications',
    excerpt:
      'Lightweight carbon composite airframes and standardized engine tuning revealed for the 2026 season.',
    status: 'published',
    createdDaysAgo: 4,
  });

  await createItem({
    siteId: airSportsSite.id,
    siteName: airSportsSite.name,
    type: 'article',
    title: 'Alpine Paragliding Grand Prix Suspended Due to Mountain Wave Wind Shear',
    slug: 'paragliding-grand-prix-suspended',
    excerpt:
      'Race officials issue safety grounding order after gusts exceed 45 knots over mountain ridges.',
    status: 'published',
    createdDaysAgo: 2,
  });

  await createItem({
    siteId: airSportsSite.id,
    siteName: airSportsSite.name,
    type: 'air_sports_update',
    title: 'Next-Gen Composite Materials Revolutionizing Competition Gliders',
    slug: 'composite-materials-competition-gliders',
    excerpt: 'Aerodynamic stiffness and thermal resilience testing in modern aerodynamic wings.',
    status: 'draft',
    createdDaysAgo: 1,
  });

  await createItem({
    siteId: airSportsSite.id,
    siteName: airSportsSite.name,
    type: 'article',
    title: 'Aerobatics Masterclass: Handling High-G Pullouts and Disorientation Safely',
    slug: 'aerobatics-masterclass-high-g',
    excerpt: 'Physiological conditioning and cockpit instrumentation drills for acrobatic pilots.',
    status: 'scheduled',
    scheduledFor: new Date(Date.now() + 3 * 86400 * 1000),
    createdDaysAgo: 0,
  });

  console.log('Successfully seeded 10 realistic publication items and audit records.');
}

async function main(): Promise<void> {
  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    await seedContentData(dataSource);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
