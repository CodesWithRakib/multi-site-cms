import { describe, expect, it } from 'vitest';

import { parsePublicWebEnv, publicWebEnvSchema } from './index';

describe('publicWebEnvSchema', () => {
  it('provides a local development API URL by default', () => {
    const env = publicWebEnvSchema.parse({});

    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000/api/v1');
    expect(env.NEXT_PUBLIC_APP_URL).toBeUndefined();
  });

  it('accepts valid HTTP and HTTPS origins', () => {
    const env = parsePublicWebEnv({
      NEXT_PUBLIC_API_URL: 'https://api.example.com/api/v1',
      NEXT_PUBLIC_APP_URL: 'https://www.example.com',
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBe('https://www.example.com');
  });

  it('rejects non-HTTP protocols', () => {
    expect(() =>
      parsePublicWebEnv({
        NEXT_PUBLIC_API_URL: 'ftp://api.example.com',
      }),
    ).toThrow(/http or https/i);
  });

  it('rejects malformed URLs', () => {
    expect(() => parsePublicWebEnv({ NEXT_PUBLIC_APP_URL: 'not-a-url' })).toThrow();
  });
});
