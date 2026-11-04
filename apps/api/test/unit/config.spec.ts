import { describe, expect, it } from '@jest/globals';

import { parseEnv } from '../../src/config/env';

const DEVELOPMENT_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/multi_site_cms',
  CORS_ORIGINS: 'http://localhost:3000',
};

const PRODUCTION_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://app:secret-password@db.internal:5432/multi_site_cms',
  CORS_ORIGINS: 'https://admin.example.com,https://travel.example.com',
  PREVIEW_TOKEN_SECRET: 'production-preview-secret-at-least-32-chars',
};

describe('parseEnv', () => {
  it('accepts a minimal development environment and applies documented defaults', () => {
    const config = parseEnv(DEVELOPMENT_ENV);

    expect(config.API_PREFIX).toBe('api/v1');
    expect(config.PORT).toBe(4000);
    expect(config.HOST).toBe('0.0.0.0');
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.BODY_LIMIT).toBe('1mb');
    expect(config.TRUST_PROXY).toBe(0);
    expect(config.docsEnabled).toBe(true);
  });

  it('splits and trims CORS origins', () => {
    const config = parseEnv({
      ...DEVELOPMENT_ENV,
      CORS_ORIGINS: 'http://localhost:3000 , http://localhost:3001',
    });

    expect(config.CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:3001']);
  });

  it('rejects an invalid port', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, PORT: '70000' })).toThrow(/PORT/);
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('rejects malformed URLs and non-PostgreSQL database URLs', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, CORS_ORIGINS: 'not-a-url' })).toThrow(
      /CORS_ORIGINS/,
    );
    expect(() =>
      parseEnv({ ...DEVELOPMENT_ENV, DATABASE_URL: 'mysql://app:app@localhost/db' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejects a prefix with a leading slash or invalid characters', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, API_PREFIX: '/api/v1' })).toThrow(/API_PREFIX/);
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, API_PREFIX: 'api v1' })).toThrow(/API_PREFIX/);
  });

  it('rejects an unparseable body limit and log level', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, BODY_LIMIT: 'large' })).toThrow(/BODY_LIMIT/);
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('requires explicit DATABASE_URL and CORS_ORIGINS in production', () => {
    expect(() => parseEnv({ NODE_ENV: 'production' })).toThrow(/must be set explicitly/);
    expect(() =>
      parseEnv({ NODE_ENV: 'production', CORS_ORIGINS: 'https://admin.example.com' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('requires PREVIEW_TOKEN_SECRET in production', () => {
    const withoutPreviewSecret: NodeJS.ProcessEnv = { ...PRODUCTION_ENV };
    delete withoutPreviewSecret.PREVIEW_TOKEN_SECRET;

    expect(() => parseEnv(withoutPreviewSecret)).toThrow(/PREVIEW_TOKEN_SECRET/);
  });

  it('rejects short signing secrets', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, PREVIEW_TOKEN_SECRET: 'short' })).toThrow(
      /PREVIEW_TOKEN_SECRET/,
    );
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, REVALIDATE_SECRET: 'short' })).toThrow(
      /REVALIDATE_SECRET/,
    );
  });

  it('treats empty secrets copied from .env.example as unset', () => {
    const config = parseEnv({
      ...DEVELOPMENT_ENV,
      PREVIEW_TOKEN_SECRET: '',
      REVALIDATE_SECRET: ' ',
    });

    expect(config.PREVIEW_TOKEN_SECRET).toBeUndefined();
    expect(config.REVALIDATE_SECRET).toBeUndefined();
  });

  it('requires Cloudinary credentials when Cloudinary storage is selected', () => {
    expect(() => parseEnv({ ...DEVELOPMENT_ENV, STORAGE_PROVIDER: 'cloudinary' })).toThrow(
      /requires CLOUDINARY_CLOUD_NAME/,
    );
    expect(
      parseEnv({
        ...DEVELOPMENT_ENV,
        STORAGE_PROVIDER: 'cloudinary',
        CLOUDINARY_URL: 'cloudinary://key:secret@demo-cloud',
      }).STORAGE_PROVIDER,
    ).toBe('cloudinary');
  });

  it('parses SITE_REVALIDATE_URLS into a site-key map', () => {
    expect(parseEnv(DEVELOPMENT_ENV).SITE_REVALIDATE_URLS).toEqual({});
    expect(
      parseEnv({
        ...DEVELOPMENT_ENV,
        SITE_REVALIDATE_URLS:
          ' travel-blog=http://localhost:5001/ , air-sports=https://air.internal ',
      }).SITE_REVALIDATE_URLS,
    ).toEqual({ 'travel-blog': 'http://localhost:5001', 'air-sports': 'https://air.internal' });
  });

  it.each(['travel-blog', '=http://x', 'Travel=http://x', 'travel-blog=ftp://x', 'a=not a url'])(
    'rejects malformed SITE_REVALIDATE_URLS %j',
    (value) => {
      expect(() => parseEnv({ ...DEVELOPMENT_ENV, SITE_REVALIDATE_URLS: value })).toThrow(
        /SITE_REVALIDATE_URLS/,
      );
    },
  );

  it('rejects localhost origins in production', () => {
    expect(() =>
      parseEnv({
        ...PRODUCTION_ENV,
        CORS_ORIGINS: 'https://admin.example.com,http://localhost:3000',
      }),
    ).toThrow(/localhost/);
  });

  it('disables docs in production by default and allows explicit opt-in', () => {
    expect(parseEnv(PRODUCTION_ENV).docsEnabled).toBe(false);
    expect(parseEnv({ ...PRODUCTION_ENV, DOCS_ENABLED: 'true' }).docsEnabled).toBe(true);
  });

  it('never echoes configuration values in an error message', () => {
    let message = '';

    try {
      parseEnv({ ...PRODUCTION_ENV, PORT: 'not-a-port' });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }

    expect(message).toContain('PORT');
    expect(message).not.toContain('secret-password');
  });
});
