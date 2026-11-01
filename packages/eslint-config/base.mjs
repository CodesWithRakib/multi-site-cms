import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export const globalIgnores = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/next-env.d.ts',
];

/**
 * Baseline rules for every TypeScript workspace package.
 *
 * Type-aware linting is intentionally not enabled in Phase 01: `tsc` already
 * enforces the strict type surface, and avoiding project-service coupling keeps
 * the lint task fast and predictable. Revisit in a dedicated ADR if the team
 * needs type-aware rules.
 */
export function createBaseConfig() {
  return tseslint.config(
    { ignores: globalIgnores },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        eqeqeq: ['error', 'always'],
        'no-implicit-coercion': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@multi-site-cms/*/src/*'],
                message: 'Import through the package public entry point, not its source internals.',
              },
            ],
          },
        ],
        'prefer-const': ['error', { destructuring: 'all' }],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      languageOptions: {
        globals: {
          ...globals.node,
        },
      },
      rules: {
        'no-console': 'off',
      },
    },
  );
}
