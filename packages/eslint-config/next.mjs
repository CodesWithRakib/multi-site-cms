import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import { createBaseConfig } from './base.mjs';

/**
 * Next.js flat config. It layers the official Next.js core-web-vitals rules on
 * top of the workspace baseline and prevents web applications from importing
 * backend-only modules.
 */
export function createNextConfig() {
  return [
    ...createBaseConfig(),
    ...nextCoreWebVitals,
    {
      files: ['**/*.{ts,tsx}'],
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
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@multi-site-cms/*/src/*'],
                message: 'Import through the package public entry point, not its source internals.',
              },
              {
                group: ['@nestjs/*'],
                message: 'Web applications must not import backend framework modules.',
              },
            ],
          },
        ],
        'prefer-const': ['error', { destructuring: 'all' }],
      },
    },
  ];
}
