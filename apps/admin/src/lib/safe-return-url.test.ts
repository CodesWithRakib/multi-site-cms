import { describe, expect, it } from 'vitest';

import { safeReturnUrl } from './safe-return-url';

describe('safeReturnUrl', () => {
  it('keeps same-origin paths with query and hash', () => {
    expect(safeReturnUrl('/posts')).toBe('/posts');
    expect(safeReturnUrl('/posts?site=travel#top')).toBe('/posts?site=travel#top');
  });

  it('falls back when the value is missing or empty', () => {
    expect(safeReturnUrl(null)).toBe('/');
    expect(safeReturnUrl(undefined)).toBe('/');
    expect(safeReturnUrl('')).toBe('/');
  });

  it('rejects external and protocol-relative destinations', () => {
    expect(safeReturnUrl('https://evil.example')).toBe('/');
    expect(safeReturnUrl('//evil.example')).toBe('/');
    expect(safeReturnUrl('/\\evil.example')).toBe('/');
    expect(safeReturnUrl('javascript:alert(1)')).toBe('/');
    expect(safeReturnUrl('/\t/evil.example')).toBe('/');
  });

  it('does not loop back to the login page', () => {
    expect(safeReturnUrl('/login')).toBe('/');
    expect(safeReturnUrl('/login?returnUrl=/posts')).toBe('/');
  });
});
