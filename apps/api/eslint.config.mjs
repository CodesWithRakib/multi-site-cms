import { createBaseConfig } from '@multi-site-cms/eslint-config/base';

export default [
  ...createBaseConfig(),
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@multi-site-cms/*/src/*'],
              message: 'Import through the package public entry point, not its source internals.',
            },
            {
              group: [
                'next',
                'next/*',
                'react',
                'react-dom',
                '@multi-site-cms/ui',
                '@multi-site-cms/redux',
                '@multi-site-cms/api-client',
              ],
              message: 'The API application must not import browser or UI modules.',
            },
          ],
        },
      ],
    },
  },
];
