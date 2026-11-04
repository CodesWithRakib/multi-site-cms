import { describe, expect, it } from 'vitest';

import {
  MAX_REVALIDATION_ITEMS,
  parseRevalidationPayload,
  verifyRevalidationSecret,
} from './revalidation';

const SECRET = 'a-sufficiently-long-shared-secret';

describe('verifyRevalidationSecret', () => {
  it('fails closed when no secret is configured', () => {
    expect(verifyRevalidationSecret(SECRET, undefined)).toBe('unconfigured');
    expect(verifyRevalidationSecret(SECRET, '')).toBe('unconfigured');
  });

  it('rejects a missing or wrong secret', () => {
    expect(verifyRevalidationSecret(null, SECRET)).toBe('invalid');
    expect(verifyRevalidationSecret('', SECRET)).toBe('invalid');
    expect(verifyRevalidationSecret(`${SECRET}x`, SECRET)).toBe('invalid');
  });

  it('accepts the exact secret', () => {
    expect(verifyRevalidationSecret(SECRET, SECRET)).toBe('ok');
  });
});

describe('parseRevalidationPayload', () => {
  it('accepts paths and tags and removes duplicates', () => {
    expect(
      parseRevalidationPayload({
        paths: ['/articles/a', '/articles/a', '/'],
        tags: ['site:travel-blog'],
      }),
    ).toEqual({ paths: ['/articles/a', '/'], tags: ['site:travel-blog'] });
  });

  it('treats omitted arrays as empty', () => {
    expect(parseRevalidationPayload({})).toEqual({ paths: [], tags: [] });
  });

  it.each([
    null,
    'paths',
    [],
    { paths: '/articles/a' },
    { paths: [1] },
    { paths: ['articles/a'] },
    { paths: ['//evil.example.com'] },
    { paths: ['/a?x=1'] },
    { paths: ['/a b'] },
    { tags: [''] },
    { tags: ['has space'] },
  ])('rejects malformed payload %j', (body) => {
    expect(parseRevalidationPayload(body)).toBeNull();
  });

  it('rejects oversized payloads', () => {
    const paths = Array.from({ length: MAX_REVALIDATION_ITEMS + 1 }, (_, i) => `/p/${i}`);
    expect(parseRevalidationPayload({ paths })).toBeNull();
  });
});
