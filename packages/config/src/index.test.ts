import { describe, expect, it } from 'vitest';

import { createPublicWebConfig } from './index';

describe('createPublicWebConfig', () => {
  it('normalizes trailing slashes and uses the application fallback', () => {
    const config = createPublicWebConfig(
      { NEXT_PUBLIC_API_URL: 'https://api.example.com/api/v1/' },
      { appUrlFallback: 'http://localhost:3000/' },
    );

    expect(config).toEqual({
      apiBaseUrl: 'https://api.example.com/api/v1',
      appUrl: 'http://localhost:3000',
    });
  });

  it('prefers an explicit public application URL', () => {
    const config = createPublicWebConfig(
      {
        NEXT_PUBLIC_API_URL: 'https://api.example.com/api/v1',
        NEXT_PUBLIC_APP_URL: 'https://admin.example.com/',
      },
      { appUrlFallback: 'http://localhost:3000' },
    );

    expect(config.appUrl).toBe('https://admin.example.com');
  });

  it('falls back to the local API URL when none is configured', () => {
    const config = createPublicWebConfig({}, { appUrlFallback: 'http://localhost:3001' });

    expect(config.apiBaseUrl).toBe('http://localhost:4000/api/v1');
  });

  it('fails fast for invalid public configuration', () => {
    expect(() =>
      createPublicWebConfig(
        { NEXT_PUBLIC_API_URL: 'not-a-url' },
        { appUrlFallback: 'http://localhost:3000' },
      ),
    ).toThrow();
  });
});
