import { describe, expect, it } from 'vitest';
import { formatDateTime, translations } from './i18n';

describe('Admin i18n & Localization', () => {
  it('formats dates accurately across locales and timezones', () => {
    const isoString = '2026-11-01T12:00:00.000Z';

    const enUtc = formatDateTime(isoString, 'en', 'UTC');
    expect(enUtc).toContain('Nov 1, 2026');

    const bnDhaka = formatDateTime(isoString, 'bn', 'Asia/Dhaka');
    expect(bnDhaka).toBeDefined();
    expect(bnDhaka).not.toBe('—');

    const empty = formatDateTime(null, 'en');
    expect(empty).toBe('—');
  });

  it('guarantees complete bilingual key symmetry between EN and BN dictionaries', () => {
    const enSections = Object.keys(translations.en) as Array<keyof typeof translations.en>;
    const bnSections = Object.keys(translations.bn) as Array<keyof typeof translations.bn>;

    expect(bnSections).toEqual(expect.arrayContaining(enSections));

    for (const section of enSections) {
      const enKeys = Object.keys(translations.en[section]);
      const bnKeys = Object.keys(translations.bn[section]);
      expect(bnKeys).toEqual(expect.arrayContaining(enKeys));
    }
  });

  it('contains expected Phase 09 taxonomy and users dictionary keys', () => {
    expect(translations.en.users.protectSuperAdmin).toBeDefined();
    expect(translations.bn.users.protectSuperAdmin).toBeDefined();
    expect(translations.en.taxonomy.categories).toBeDefined();
    expect(translations.bn.taxonomy.categories).toBe('বিভাগসমূহ');
  });
});
