import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Analytics and Traffic Events
 *
 * Implements:
 * 1. `analytics_page_views` table with site isolation, post referencing,
 *    demographic/device tracking, and duration metrics.
 * 2. High-performance composite indexes for real-time and historical range queries.
 * 3. Seed data generation across the last 90 days for existing sites.
 */
export class AnalyticsAndTrafficEvents1793491207000 implements MigrationInterface {
  name = 'AnalyticsAndTrafficEvents1793491207000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create analytics_page_views table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analytics_page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "site_id" uuid NOT NULL,
        "post_id" uuid,
        "path" text NOT NULL,
        "referrer" text,
        "referrer_source" text NOT NULL DEFAULT 'direct',
        "visitor_id" text NOT NULL,
        "device_type" text NOT NULL DEFAULT 'desktop',
        "browser" text NOT NULL DEFAULT 'chrome',
        "os" text NOT NULL DEFAULT 'windows',
        "country_code" text NOT NULL DEFAULT 'US',
        "country_name" text NOT NULL DEFAULT 'United States',
        "duration_seconds" integer NOT NULL DEFAULT 45,
        "is_unique" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_analytics_page_views_site" FOREIGN KEY ("site_id")
          REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_analytics_page_views_post" FOREIGN KEY ("post_id")
          REFERENCES "posts" ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_analytics_page_views_device"
          CHECK ("device_type" IN ('desktop', 'mobile', 'tablet')),
        CONSTRAINT "CHK_analytics_page_views_source"
          CHECK ("referrer_source" IN ('direct', 'search', 'social', 'newsletter', 'referral'))
      )
    `);

    // 2. High-performance indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_site_created"
        ON "analytics_page_views" ("site_id", "created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_post_created"
        ON "analytics_page_views" ("post_id", "created_at" DESC)
        WHERE "post_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_created"
        ON "analytics_page_views" ("created_at" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_analytics_site_path"
        ON "analytics_page_views" ("site_id", "path");
    `);

    // 3. Populate rich seed analytics across past 90 days for existing sites
    await queryRunner.query(`
      DO $$
      DECLARE
        site_rec RECORD;
        post_rec RECORD;
        day_offset INT;
        views_today INT;
        v_idx INT;
        sample_devices TEXT[] := ARRAY['desktop', 'mobile', 'mobile', 'mobile', 'tablet'];
        sample_browsers TEXT[] := ARRAY['chrome', 'chrome', 'safari', 'firefox', 'edge'];
        sample_os TEXT[] := ARRAY['windows', 'ios', 'android', 'macos', 'linux'];
        sample_sources TEXT[] := ARRAY['search', 'search', 'direct', 'social', 'newsletter', 'referral'];
        sample_referrers TEXT[] := ARRAY[
          'https://www.google.com/',
          'https://www.google.com/',
          'https://twitter.com/',
          'https://www.instagram.com/',
          'https://linkedin.com/',
          'https://news.ycombinator.com/'
        ];
        sample_countries TEXT[][] := ARRAY[
          ARRAY['US', 'United States'],
          ARRAY['US', 'United States'],
          ARRAY['BD', 'Bangladesh'],
          ARRAY['GB', 'United Kingdom'],
          ARRAY['DE', 'Germany'],
          ARRAY['JP', 'Japan'],
          ARRAY['CA', 'Canada'],
          ARRAY['FR', 'France'],
          ARRAY['AU', 'Australia']
        ];
        random_country INT;
        chosen_device TEXT;
        chosen_browser TEXT;
        chosen_os TEXT;
        chosen_source TEXT;
        chosen_ref TEXT;
        v_duration INT;
        v_unique BOOLEAN;
        v_time TIMESTAMPTZ;
        v_path TEXT;
        v_post_id UUID;
      BEGIN
        FOR site_rec IN SELECT id, key FROM sites LOOP
          -- Iterate across past 90 days
          FOR day_offset IN 0..89 LOOP
            -- Base traffic of 12-35 views per day
            views_today := 12 + floor(random() * 24)::INT;
            
            -- Slight growth curve towards recent days
            IF day_offset < 14 THEN
              views_today := views_today + 8;
            END IF;

            FOR v_idx IN 1..views_today LOOP
              random_country := 1 + floor(random() * 9)::INT;
              chosen_device := sample_devices[1 + floor(random() * array_length(sample_devices, 1))::INT];
              chosen_browser := sample_browsers[1 + floor(random() * array_length(sample_browsers, 1))::INT];
              chosen_os := sample_os[1 + floor(random() * array_length(sample_os, 1))::INT];
              chosen_source := sample_sources[1 + floor(random() * array_length(sample_sources, 1))::INT];
              
              IF chosen_source = 'direct' THEN
                chosen_ref := NULL;
              ELSE
                chosen_ref := sample_referrers[1 + floor(random() * array_length(sample_referrers, 1))::INT];
              END IF;

              v_duration := 20 + floor(random() * 260)::INT;
              v_unique := (random() > 0.3);
              v_time := (now() - (day_offset || ' days')::INTERVAL) + (floor(random() * 86400) || ' seconds')::INTERVAL;

              -- Pick a post from this site or root page
              v_post_id := NULL;
              v_path := '/';

              SELECT pp.post_id, '/' || pp.slug INTO post_rec
              FROM post_publications pp
              WHERE pp.site_id = site_rec.id AND pp.status = 'published'
              ORDER BY random()
              LIMIT 1;

              IF post_rec.post_id IS NOT NULL AND random() > 0.25 THEN
                v_post_id := post_rec.post_id;
                v_path := post_rec.slug;
              END IF;

              INSERT INTO analytics_page_views (
                site_id,
                post_id,
                path,
                referrer,
                referrer_source,
                visitor_id,
                device_type,
                browser,
                os,
                country_code,
                country_name,
                duration_seconds,
                is_unique,
                created_at
              ) VALUES (
                site_rec.id,
                v_post_id,
                v_path,
                chosen_ref,
                chosen_source,
                md5(random()::text || v_time::text),
                chosen_device,
                chosen_browser,
                chosen_os,
                sample_countries[random_country][1],
                sample_countries[random_country][2],
                v_duration,
                v_unique,
                v_time
              );
            END LOOP;
          END LOOP;
        END LOOP;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "analytics_page_views" CASCADE`);
  }
}
