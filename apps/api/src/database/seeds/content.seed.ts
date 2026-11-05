import 'reflect-metadata';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
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

export async function seedMediaData(dataSource: DataSource): Promise<void> {
  const users: Array<{ id: string }> = await dataSource.query(
    `SELECT id FROM users ORDER BY created_at ASC LIMIT 1`,
  );
  const firstUser = users[0];
  if (!firstUser) return;
  const authorId = firstUser.id;

  const sites: Array<{ id: string; key: string; name: string }> = await dataSource.query(
    `SELECT id, key, name FROM sites WHERE key IN ('travel-blog', 'air-sports')`,
  );
  const travelSite = sites.find((s) => s.key === 'travel-blog');
  const airSportsSite = sites.find((s) => s.key === 'air-sports');
  if (!travelSite || !airSportsSite) return;

  const existingMedia: Array<{ count: string }> = await dataSource.query(
    `SELECT count(*)::text as count FROM media_assets WHERE deleted_at IS NULL`,
  );
  if (Number.parseInt(existingMedia[0]?.count || '0', 10) >= 5) {
    console.log('Media assets already seeded, skipping media seed.');
    return;
  }

  console.log('Seeding realistic media assets and linking to publications...');

  const storageRoot = path.resolve(
    process.env.MEDIA_STORAGE_DIR ||
      (process.cwd().endsWith('api') ? 'uploads' : path.join('apps', 'api', 'uploads')),
  );

  const mediaItems: Array<{
    siteId: string;
    filename: string;
    title: string;
    subtitle: string;
    category: string;
    altText: string;
    caption: string;
    themeColor1: string;
    themeColor2: string;
    accentColor: string;
    symbolSvg: string;
    postSlugMatch?: string;
  }> = [
    // Travel Blog
    {
      siteId: travelSite.id,
      filename: 'swiss-alps-panorama.svg',
      title: 'Swiss Bernese Alps',
      subtitle: 'Snow-capped summits glowing in the evening alpenglow',
      category: 'Destination',
      altText: 'Snow-dusted Alpine summits glowing pink in the evening alpenglow',
      caption: 'Breathtaking panorama across the Swiss Bernese Alps.',
      themeColor1: '#082625',
      themeColor2: '#0f3a38',
      accentColor: '#00e599',
      symbolSvg: `<path d="M-180 120 L-60 -40 L40 60 L140 -80 L260 120 Z" fill="none" stroke="#00e599" stroke-width="6" stroke-linejoin="round"/>
                  <circle cx="140" cy="-80" r="12" fill="#00e599"/>`,
      postSlugMatch: 'sustainable-travel-europe',
    },
    {
      siteId: travelSite.id,
      filename: 'chiang-mai-temple.svg',
      title: 'Chiang Mai Sanctuaries',
      subtitle: 'Sacred mountain forest wats and Lanna architecture',
      category: 'Culture',
      altText: 'Gilded spires of Wat Phra That Doi Suthep against tropical foliage',
      caption: 'Ancient Lanna architecture nestled in the mist-shrouded hills of Chiang Mai.',
      themeColor1: '#1e1b4b',
      themeColor2: '#312e81',
      accentColor: '#fbbf24',
      symbolSvg: `<polygon points="0,-100 40,-20 120,-20 60,30 80,110 0,60 -80,110 -60,30 -120,-20 -40,-20" fill="none" stroke="#fbbf24" stroke-width="5"/>`,
      postSlugMatch: 'hidden-temples-chiang-mai',
    },
    {
      siteId: travelSite.id,
      filename: 'santorini-sunset.svg',
      title: 'Santorini Caldera',
      subtitle: 'Whitewashed Cycladic cliffs overlooking the Aegean',
      category: 'Island Living',
      altText: 'Traditional whitewashed cycladic village overlooking azure caldera waters',
      caption: 'Golden hour over Oia, Santorini in the southern Aegean Sea.',
      themeColor1: '#0369a1',
      themeColor2: '#0c4a6e',
      accentColor: '#38bdf8',
      symbolSvg: `<circle cx="0" cy="0" r="80" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="8 8"/>
                  <path d="M-50 40 Q0 -60 50 40" fill="none" stroke="#ffffff" stroke-width="6"/>`,
      postSlugMatch: 'culinary-heritage-oaxaca',
    },
    {
      siteId: travelSite.id,
      filename: 'kyoto-bamboo-path.svg',
      title: 'Arashiyama Bamboo',
      subtitle: 'Sunlight filtering through towering emerald stalks',
      category: 'Nature',
      altText: 'Sunlight filtering through towering emerald bamboo groves in Arashiyama',
      caption: 'Peaceful morning walk through the sacred bamboo forest of Kyoto.',
      themeColor1: '#064e3b',
      themeColor2: '#022c22',
      accentColor: '#34d399',
      symbolSvg: `<line x1="-60" y1="120" x2="-60" y2="-100" stroke="#34d399" stroke-width="8" stroke-linecap="round"/>
                  <line x1="0" y1="120" x2="0" y2="-120" stroke="#34d399" stroke-width="10" stroke-linecap="round"/>
                  <line x1="60" y1="120" x2="60" y2="-80" stroke="#34d399" stroke-width="8" stroke-linecap="round"/>`,
    },
    {
      siteId: travelSite.id,
      filename: 'europe-rail-guide.svg',
      title: 'Continental Rail Map',
      subtitle: 'High-speed rail corridors and alpine passes',
      category: 'Transit Guide',
      altText: 'Comprehensive European Rail Corridor Travel Map & Scheduling Guide',
      caption: '2026 Continental High-Speed Rail Network Guide.',
      themeColor1: '#0f172a',
      themeColor2: '#1e293b',
      accentColor: '#60a5fa',
      symbolSvg: `<path d="M-120 40 L-40 -40 L40 40 L120 -40" fill="none" stroke="#60a5fa" stroke-width="6" stroke-dasharray="12 6"/>
                  <circle cx="-120" cy="40" r="10" fill="#60a5fa"/><circle cx="120" cy="-40" r="10" fill="#60a5fa"/>`,
    },

    // Air Sports Live
    {
      siteId: airSportsSite.id,
      filename: 'dolomites-paraglider.svg',
      title: 'Dolomites Ridge Soaring',
      subtitle: 'Thermal lift mastery at 3,200m above jagged peaks',
      category: 'Paragliding',
      altText:
        'Cross-country paraglider catching thermal lift over dramatic jagged dolomite pinnacles',
      caption: 'Chasing ridge lift at 3,200m above the Italian Dolomites.',
      themeColor1: '#082625',
      themeColor2: '#134e4a',
      accentColor: '#2dd4bf',
      symbolSvg: `<path d="M-120 -30 Q0 -90 120 -30 Q0 10 -120 -30 Z" fill="none" stroke="#2dd4bf" stroke-width="6"/>
                  <line x1="-120" y1="-30" x2="0" y2="70" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
                  <line x1="120" y1="-30" x2="0" y2="70" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
                  <circle cx="0" cy="70" r="8" fill="#2dd4bf"/>`,
      postSlugMatch: 'paragliding-grand-prix-suspended',
    },
    {
      siteId: airSportsSite.id,
      filename: 'canyon-wingsuit-formation.svg',
      title: 'Wingsuit Canyon Sprint',
      subtitle: 'Proximity flight trajectory through alpine gaps',
      category: 'Proximity Flight',
      altText: 'Proximity wingsuit pilots flying in tight echelon formation through canyon gap',
      caption: 'Precision flight trajectory through the Lauterbrunnen valley.',
      themeColor1: '#431407',
      themeColor2: '#7c2d12',
      accentColor: '#f97316',
      symbolSvg: `<polygon points="0,-80 -90,60 0,20 90,60" fill="none" stroke="#f97316" stroke-width="6" stroke-linejoin="round"/>
                  <circle cx="0" cy="-20" r="8" fill="#f97316"/>`,
      postSlugMatch: 'composite-materials-competition-gliders',
    },
    {
      siteId: airSportsSite.id,
      filename: 'cappadocia-balloons.svg',
      title: 'Cappadocia Dawn Festival',
      subtitle: 'Hundred aerostats rising across fairy chimneys',
      category: 'Ballooning',
      altText: 'Flotilla of colorful hot air balloons ascending over fairy chimney rock formations',
      caption: 'Sunrise flight festival over Göreme National Park.',
      themeColor1: '#701a75',
      themeColor2: '#4a044e',
      accentColor: '#f472b6',
      symbolSvg: `<path d="M-50 -20 C-50 -70 50 -70 50 -20 C50 20 20 50 15 70 L-15 70 C-20 50 -50 20 -50 -20 Z" fill="none" stroke="#f472b6" stroke-width="5"/>
                  <rect x="-10" y="85" width="20" height="15" fill="none" stroke="#f472b6" stroke-width="3"/>`,
    },
    {
      siteId: airSportsSite.id,
      filename: 'aerobatic-smoke-maneuver.svg',
      title: 'Vertical Freestyle Aerobatics',
      subtitle: 'High-G inverted pullout and smoke trailing sequences',
      category: 'Freestyle Aerobatics',
      altText: 'Competition aerobatic monoplane performing vertical hammerhead with smoke trail',
      caption: 'High-G aerobatic sequence at the European Freestyle Championship.',
      themeColor1: '#1e3a8a',
      themeColor2: '#172554',
      accentColor: '#38bdf8',
      symbolSvg: `<path d="M0 -120 L0 100 M-80 -40 L80 -40 M-30 80 L30 80" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>`,
      postSlugMatch: 'aerobatics-masterclass-high-g',
    },
    {
      siteId: airSportsSite.id,
      filename: 'safety-regulations-manual.svg',
      title: 'FAI Flight Regulations',
      subtitle: 'Safety standards and emergency egress protocols',
      category: 'Aviation Safety',
      altText: 'FAI Aeronautical Federation Safety Protocols and Equipment Handbook',
      caption: 'Official 2026 Air Sports Safety & Emergency Egress Manual.',
      themeColor1: '#091c1b',
      themeColor2: '#072423',
      accentColor: '#00e599',
      symbolSvg: `<rect x="-60" y="-80" width="120" height="160" rx="8" fill="none" stroke="#00e599" stroke-width="5"/>
                  <line x1="-35" y1="-40" x2="35" y2="-40" stroke="#00e599" stroke-width="4"/>
                  <line x1="-35" y1="-10" x2="35" y2="-10" stroke="#00e599" stroke-width="4"/>
                  <line x1="-35" y1="20" x2="10" y2="20" stroke="#00e599" stroke-width="4"/>`,
    },
  ];

  for (const item of mediaItems) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${item.themeColor1}"/>
      <stop offset="100%" stop-color="${item.themeColor2}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect width="1200" height="800" fill="url(#grid)"/>
  <circle cx="1020" cy="180" r="260" fill="${item.accentColor}" opacity="0.12"/>
  <circle cx="160" cy="680" r="200" fill="${item.themeColor1}" opacity="0.25"/>
  <g transform="translate(100, 110)">
    <rect x="0" y="0" width="180" height="36" rx="18" fill="rgba(255,255,255,0.12)"/>
    <text x="90" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${item.category.toUpperCase()}</text>
    <text x="0" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${item.title}</text>
    <text x="0" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="400" fill="rgba(255,255,255,0.75)">${item.subtitle}</text>
  </g>
  <g transform="translate(600, 480)" text-anchor="middle">
    ${item.symbolSvg}
  </g>
  <g transform="translate(100, 730)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.35)">MULTI-SITE CMS · EDITORIAL ASSET · 1200 × 800</text>
  </g>
</svg>`;

    const buffer = Buffer.from(svgContent, 'utf-8');
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const byteSize = String(buffer.byteLength);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const storageKey = `${item.siteId}/${year}/${month}/${item.filename}`;

    const filePath = path.join(storageRoot, storageKey);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);

    // Insert into media_assets
    const res: Array<{ id: string }> = await dataSource.query(
      `INSERT INTO media_assets (
         site_id, uploaded_by, storage_provider, storage_key, original_filename,
         mime_type, byte_size, checksum, width, height, alt_text, caption,
         status, created_at, updated_at
       ) VALUES ($1, $2, 'local', $3, $4, 'image/svg+xml', $5, $6, 1200, 800, $7, $8, 'active', NOW(), NOW())
       ON CONFLICT (storage_key) DO UPDATE SET alt_text = EXCLUDED.alt_text
       RETURNING id`,
      [
        item.siteId,
        authorId,
        storageKey,
        item.filename,
        byteSize,
        checksum,
        item.altText,
        item.caption,
      ],
    );

    const assetId = res[0]?.id;

    if (assetId && item.postSlugMatch) {
      await dataSource.query(
        `UPDATE post_publications SET featured_image_id = $1 WHERE site_id = $2 AND slug = $3`,
        [assetId, item.siteId, item.postSlugMatch],
      );
    }
  }

  console.log(
    `Successfully seeded ${mediaItems.length} realistic media assets and linked featured images.`,
  );
}

async function main(): Promise<void> {
  const dataSource = new DataSource(buildDataSourceOptions(env.DATABASE_URL));
  await dataSource.initialize();
  try {
    await seedContentData(dataSource);
    await seedMediaData(dataSource);
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
