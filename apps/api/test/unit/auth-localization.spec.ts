import { describe, expect, it } from '@jest/globals';

import { bn, en } from '../../src/common/i18n/messages';
import { translate } from '../../src/common/i18n/translate';

describe('Authentication & Authorization Localization', () => {
  const authKeys = [
    'auth.invalidCredentials',
    'auth.accountInactive',
    'auth.accountLocked',
    'auth.sessionExpired',
    'auth.csrfFailed',
    'auth.lastSuperAdmin',
    'auth.cannotSelfDemote',
    'auth.roleNotAssignable',
    'auth.siteRequired',
    'auth.siteForbidden',
    'auth.siteNotFound',
    'user.notFound',
    'user.emailConflict',
    'role.notFound',
    'role.assignmentNotFound',
  ] as const;

  it('provides translations for all auth keys in both English and Bangla', () => {
    for (const key of authKeys) {
      expect(en[key]).toBeDefined();
      expect(bn[key]).toBeDefined();
      expect(en[key].length).toBeGreaterThan(0);
      expect(bn[key].length).toBeGreaterThan(0);
    }
  });

  it('translates messages into the requested locale', () => {
    const enMsg = translate('en', 'auth.invalidCredentials');
    const bnMsg = translate('bn', 'auth.invalidCredentials');

    expect(enMsg).toBe('Invalid email or password.');
    expect(bnMsg).toBe('অবৈধ ইমেইল অথবা পাসওয়ার্ড।');
  });

  it('does not leak account existence or sensitive details in error messages', () => {
    expect(en['auth.invalidCredentials']).not.toContain('email not found');
    expect(en['auth.invalidCredentials']).not.toContain('password incorrect');
    expect(bn['auth.invalidCredentials']).not.toContain('ইমেইল পাওয়া যায়নি');
  });
});
