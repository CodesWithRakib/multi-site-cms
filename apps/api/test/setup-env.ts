process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.PORT = '4001';
process.env.CORS_ORIGINS = 'http://localhost:3000';

// Integration runs pass TEST_DATABASE_URL (for example a Compose instance on
// another port); unit and HTTP tests never connect, so the default is inert.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://multi_site_cms:multi_site_cms_dev@localhost:5433/multi_site_cms_test';

process.env.TRUST_PROXY = '1';
process.env.LOG_LEVEL = 'silent';
process.env.PREVIEW_TOKEN_SECRET = 'test-preview-token-secret-0123456789abcdef';

// Tests must never reach a real storage account. `config/env.ts` loads `.env`,
// but `process.loadEnvFile` does not override variables that are already set,
// so pinning them here keeps a developer's Cloudinary credentials out of tests.
process.env.STORAGE_PROVIDER = 'local';
process.env.CLOUDINARY_URL = '';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
