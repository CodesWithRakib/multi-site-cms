process.env.NODE_ENV = 'test';
process.env.HOST = '127.0.0.1';
process.env.PORT = '4001';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.DATABASE_URL =
  'postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms_test';
process.env.TRUST_PROXY = '0';
