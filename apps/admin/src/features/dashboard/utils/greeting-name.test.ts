import { describe, expect, it } from 'vitest';

import { greetingName } from './greeting-name';

describe('greetingName', () => {
  it('skips honorifics and abbreviations', () => {
    expect(greetingName('Md. Rakib Islam')).toBe('Rakib');
    expect(greetingName('Dr. Ashiqur Rahaman')).toBe('Ashiqur');
  });

  it('uses the first name otherwise', () => {
    expect(greetingName('Ashiqur Rahaman')).toBe('Ashiqur');
    expect(greetingName('  Rakib  ')).toBe('Rakib');
  });

  it('falls back to the whole name when every token is abbreviated, and to null when empty', () => {
    expect(greetingName('Md.')).toBe('Md.');
    expect(greetingName('')).toBeNull();
    expect(greetingName(undefined)).toBeNull();
  });
});
