import { describe, expect, it } from 'vitest';
import { normalizeHostname } from './index';

describe('normalizeHostname', () => {
  it('normalizes standard uppercase and mixed case hostnames', () => {
    expect(normalizeHostname('Travel-Blog.Example.COM')).toEqual({
      isValid: true,
      normalized: 'travel-blog.example.com',
    });
  });

  it('strips accidental protocols and whitespace', () => {
    expect(normalizeHostname('  https://air-sports.example.com  ')).toEqual({
      isValid: true,
      normalized: 'air-sports.example.com',
    });
  });

  it('strips ports from local development hosts', () => {
    expect(normalizeHostname('localhost:5000')).toEqual({
      isValid: true,
      normalized: 'localhost',
    });
    expect(normalizeHostname('travel.local:3000')).toEqual({
      isValid: true,
      normalized: 'travel.local',
    });
  });

  it('strips trailing dots from FQDN notations', () => {
    expect(normalizeHostname('travel-blog.example.com.')).toEqual({
      isValid: true,
      normalized: 'travel-blog.example.com',
    });
  });

  it('rejects URLs with paths, queries, or fragments', () => {
    expect(normalizeHostname('example.com/blog')).toEqual({
      isValid: false,
      normalized: '',
      error: 'Hostname must not include a path, query parameter, or fragment',
    });
    expect(normalizeHostname('example.com?query=1')).toEqual({
      isValid: false,
      normalized: '',
      error: 'Hostname must not include a path, query parameter, or fragment',
    });
    expect(normalizeHostname('example.com#section')).toEqual({
      isValid: false,
      normalized: '',
      error: 'Hostname must not include a path, query parameter, or fragment',
    });
  });

  it('rejects credentials in hostnames', () => {
    expect(normalizeHostname('admin:secret@example.com')).toEqual({
      isValid: false,
      normalized: '',
      error: 'Hostname must not include user credentials',
    });
  });

  it('rejects wildcards', () => {
    expect(normalizeHostname('*.example.com')).toEqual({
      isValid: false,
      normalized: '',
      error: 'Wildcard domains are not permitted',
    });
  });

  it('rejects invalid labels with leading or trailing hyphens or empty labels', () => {
    expect(normalizeHostname('-example.com').isValid).toBe(false);
    expect(normalizeHostname('example-.com').isValid).toBe(false);
    expect(normalizeHostname('example..com').isValid).toBe(false);
  });
});
