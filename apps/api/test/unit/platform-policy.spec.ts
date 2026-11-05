import { describe, expect, it } from '@jest/globals';
import type { PlatformSettings } from '@multi-site-cms/types';

import {
  MEDIA_UPLOAD_HARD_LIMIT_BYTES,
  passwordPolicyViolation,
  policyFromSettings,
  SAFE_DEFAULT_POLICY,
} from '../../src/settings/platform-policy';

/** A stored row as it may look after direct edits or older versions. */
function stored(overrides: Record<string, unknown>): PlatformSettings {
  return {
    id: 'default',
    general: {} as PlatformSettings['general'],
    security: {} as PlatformSettings['security'],
    media: {} as PlatformSettings['media'],
    publishing: {} as PlatformSettings['publishing'],
    maintenance: {} as PlatformSettings['maintenance'],
    updatedAt: new Date(0).toISOString(),
    updatedBy: null,
    ...overrides,
  } as PlatformSettings;
}

describe('policyFromSettings', () => {
  it('maps valid settings to enforcement units', () => {
    const policy = policyFromSettings(
      stored({
        security: {
          sessionTtlHours: 2,
          maxLoginAttempts: 3,
          lockoutDurationMinutes: 10,
          passwordMinLength: 12,
          requireStrongPasswords: false,
        },
        publishing: {
          defaultPostStatus: 'in_review',
          autoSaveIntervalSeconds: 60,
          maxRevisionHistory: 10,
          previewTokenTtlMinutes: 30,
        },
      }),
    );
    expect(policy.login).toEqual({ maxAttempts: 3, lockoutMs: 10 * 60_000 });
    expect(policy.session).toEqual({ absoluteTtlMs: 2 * 3_600_000, idleTimeoutMs: 2 * 3_600_000 });
    expect(policy.password).toEqual({ minLength: 12, requireStrong: false });
    expect(policy.publishing).toEqual({
      defaultPostStatus: 'in_review',
      autoSaveIntervalSeconds: 60,
      maxRevisionHistory: 10,
      previewTokenTtlMs: 30 * 60_000,
    });
  });

  it('never weakens a control below its floor, whatever is stored', () => {
    const policy = policyFromSettings(
      stored({
        security: { maxLoginAttempts: 0, passwordMinLength: 3, sessionTtlHours: 99_999 },
        media: { maxUploadSizeBytes: 10 * MEDIA_UPLOAD_HARD_LIMIT_BYTES },
        maintenance: { auditRetentionDays: 7 },
      }),
    );
    expect(policy.login.maxAttempts).toBe(1);
    expect(policy.password.minLength).toBe(8);
    expect(policy.session.absoluteTtlMs).toBe(720 * 3_600_000);
    expect(policy.session.idleTimeoutMs).toBe(24 * 3_600_000);
    expect(policy.media.maxUploadBytes).toBe(MEDIA_UPLOAD_HARD_LIMIT_BYTES);
    expect(policy.retention.auditDays).toBe(365);
  });

  it('falls back to safe defaults for missing or mistyped values', () => {
    const policy = policyFromSettings(
      stored({
        security: { maxLoginAttempts: '5; DROP', requireStrongPasswords: 'no' },
        media: { allowedMimeTypes: 'everything' },
        publishing: { defaultPostStatus: 'published' },
      }),
    );
    expect(policy.login).toEqual(SAFE_DEFAULT_POLICY.login);
    expect(policy.password.requireStrong).toBe(true);
    expect(policy.media.allowedMimeTypes).toEqual(SAFE_DEFAULT_POLICY.media.allowedMimeTypes);
    expect(policy.publishing.defaultPostStatus).toBe('draft');
  });

  it('only narrows upload types to the code allowlist', () => {
    const policy = policyFromSettings(
      stored({
        media: { allowedMimeTypes: ['IMAGE/PNG', 'text/html', 'application/x-msdownload'] },
      }),
    );
    expect(policy.media.allowedMimeTypes).toEqual(['image/png']);
  });
});

describe('passwordPolicyViolation', () => {
  const strict = { minLength: 10, requireStrong: true };

  it('checks length first, then character classes', () => {
    expect(passwordPolicyViolation('Ab1', strict)).toBe('auth.passwordTooShort');
    expect(passwordPolicyViolation('abcdefghij1', strict)).toBe('auth.passwordTooWeak');
    expect(passwordPolicyViolation('ABCDEFGHIJ1', strict)).toBe('auth.passwordTooWeak');
    expect(passwordPolicyViolation('Abcdefghijk', strict)).toBe('auth.passwordTooWeak');
    expect(passwordPolicyViolation('Abcdefghij1', strict)).toBeNull();
  });

  it('accepts any long-enough password when strength is not required', () => {
    expect(
      passwordPolicyViolation('abcdefghij', { minLength: 10, requireStrong: false }),
    ).toBeNull();
  });
});
