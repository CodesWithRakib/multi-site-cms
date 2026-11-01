process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.PORT = '4001';
process.env.CORS_ORIGINS = 'http://localhost:3000';

// Integration runs pass TEST_DATABASE_URL (for example a Compose instance on
// another port); unit and HTTP tests never connect, so the default is inert.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms_test';

process.env.TRUST_PROXY = '0';
process.env.LOG_LEVEL = 'silent';
