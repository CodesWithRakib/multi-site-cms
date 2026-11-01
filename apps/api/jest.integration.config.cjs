/**
 * Integration tests need a real PostgreSQL instance, so they are kept out of
 * `pnpm test` and run explicitly with `pnpm --filter @multi-site-cms/api test:integration`.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/database'],
  testRegex: '.*\\.integration-spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  clearMocks: true,
  testTimeout: 30_000,
};
