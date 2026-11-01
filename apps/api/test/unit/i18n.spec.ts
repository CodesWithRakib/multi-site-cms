import { describe, expect, it } from '@jest/globals';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from '../../src/common/i18n/locale';
import { catalogs, type MessageKey } from '../../src/common/i18n/messages';
import { translate } from '../../src/common/i18n/translate';
import { errorCodeForStatus, messageKeyForStatus } from '../../src/common/http/error-code';

describe('resolveLocale', () => {
  it('defaults to English without a header or with an unsupported language', () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('fr-FR,fr;q=0.9')).toBe('en');
    expect(resolveLocale('*')).toBe('en');
  });

  it('resolves supported languages including regional variants', () => {
    expect(resolveLocale('bn')).toBe('bn');
    expect(resolveLocale('bn-BD')).toBe('bn');
    expect(resolveLocale('BN-bd,bn;q=0.9')).toBe('bn');
    expect(resolveLocale('en-GB,en;q=0.8')).toBe('en');
  });

  it('honours quality values and ordering', () => {
    expect(resolveLocale('en;q=0.4,bn;q=0.9')).toBe('bn');
    expect(resolveLocale('bn;q=0.4,en;q=0.9')).toBe('en');
    expect(resolveLocale('bn;q=0.9,en;q=0.9')).toBe('bn');
  });

  it('ignores zero-quality and malformed entries', () => {
    expect(resolveLocale('bn;q=0')).toBe('en');
    expect(resolveLocale('bn;q=abc')).toBe('en');
    expect(resolveLocale(';q=1')).toBe('en');
  });

  it('bounds an oversized header instead of trusting it', () => {
    expect(resolveLocale(`${'bn, '.repeat(500)}en`)).toBe('bn');
  });
});

describe('message catalogs', () => {
  it('supports exactly the documented locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'bn']);
    expect(Object.keys(catalogs).sort()).toEqual(['bn', 'en']);
  });

  it('keeps every locale complete and non-empty', () => {
    const reference = Object.keys(catalogs.en).sort();

    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(catalogs[locale]).sort()).toEqual(reference);
      for (const value of Object.values(catalogs[locale])) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('returns localized messages without touching the key', () => {
    expect(translate('en', 'validation.isEmail')).toBe('Enter a valid email address.');
    expect(translate('bn', 'validation.isEmail')).toBe('একটি বৈধ ইমেইল ঠিকানা দিন।');
    expect(translate('bn', 'http.notFound')).toContain('পাওয়া যায়নি');
  });

  it('falls back to the key for an unknown message key', () => {
    expect(translate('en', 'missing.key' as MessageKey)).toBe('missing.key');
  });

  it('interpolates parameters and leaves unknown placeholders intact', () => {
    const message = translate('en', 'validation.maxLength');

    expect(message).not.toContain('{');
    expect(translate('en', 'missing.key' as MessageKey, { count: 3 })).toBe('missing.key');
  });
});

describe('error code mapping', () => {
  it('maps statuses to stable machine codes', () => {
    expect(errorCodeForStatus(400)).toBe('VALIDATION_ERROR');
    expect(errorCodeForStatus(401)).toBe('UNAUTHENTICATED');
    expect(errorCodeForStatus(403)).toBe('FORBIDDEN');
    expect(errorCodeForStatus(404)).toBe('NOT_FOUND');
    expect(errorCodeForStatus(409)).toBe('CONFLICT');
    expect(errorCodeForStatus(413)).toBe('PAYLOAD_TOO_LARGE');
    expect(errorCodeForStatus(422)).toBe('UNPROCESSABLE_ENTITY');
    expect(errorCodeForStatus(429)).toBe('RATE_LIMITED');
    expect(errorCodeForStatus(503)).toBe('SERVICE_UNAVAILABLE');
    expect(errorCodeForStatus(500)).toBe('INTERNAL_ERROR');
    expect(errorCodeForStatus(418)).toBe('HTTP_ERROR');
  });

  it('maps statuses to message keys that exist in the catalog', () => {
    for (const status of [400, 401, 403, 404, 409, 413, 422, 429, 500, 503, 418]) {
      const key = messageKeyForStatus(status);
      expect(catalogs.en[key]).toBeDefined();
      expect(catalogs.bn[key]).toBeDefined();
    }
  });

  it('keeps codes identical across locales', () => {
    const status = 400;
    const code = errorCodeForStatus(status);

    expect(translate('en', messageKeyForStatus(status))).not.toBe(
      translate('bn', messageKeyForStatus(status)),
    );
    expect(code).toBe('VALIDATION_ERROR');
  });
});
