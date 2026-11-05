import type { PlatformSettings } from '@multi-site-cms/types';

/**
 * The platform settings the API actually enforces, in enforcement units.
 *
 * Settings are edited by Super Admins and stored as JSON. Before use, every
 * value is clamped to bounds the code considers safe, so a stored row written
 * before validation existed (or edited directly in the database) can never
 * weaken a control below its floor. Upload types can only be narrowed: the
 * settings list is intersected with the code's own allowlist.
 */
export interface PlatformPolicy {
  readonly login: { readonly maxAttempts: number; readonly lockoutMs: number };
  readonly session: { readonly absoluteTtlMs: number; readonly idleTimeoutMs: number };
  readonly password: { readonly minLength: number; readonly requireStrong: boolean };
  readonly media: {
    readonly maxUploadBytes: number;
    readonly allowedMimeTypes: readonly string[];
  };
  readonly publishing: {
    readonly defaultPostStatus: 'draft' | 'in_review';
    readonly previewTokenTtlMs: number;
    readonly maxRevisionHistory: number;
    readonly autoSaveIntervalSeconds: number;
  };
  readonly retention: { readonly auditDays: number };
  readonly maintenance: { readonly enabled: boolean };
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Types the media pipeline can validate by signature and serve safely. */
export const MEDIA_MIME_ALLOWLIST: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'application/pdf',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
];

/** Hard ceiling for any upload, independent of settings (multer limit). */
export const MEDIA_UPLOAD_HARD_LIMIT_BYTES = 100 * 1024 * 1024;

/** Idle sessions never live longer than this, whatever the absolute TTL. */
const MAX_IDLE_TIMEOUT_MS = 24 * HOUR_MS;

/**
 * Used when settings cannot be read. Equal to the values the code enforced
 * before settings were wired, so an outage never loosens anything.
 */
export const SAFE_DEFAULT_POLICY: PlatformPolicy = {
  login: { maxAttempts: 5, lockoutMs: 15 * MINUTE_MS },
  session: { absoluteTtlMs: 7 * 24 * HOUR_MS, idleTimeoutMs: MAX_IDLE_TIMEOUT_MS },
  password: { minLength: 8, requireStrong: true },
  media: {
    maxUploadBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
  },
  publishing: {
    defaultPostStatus: 'draft',
    previewTokenTtlMs: 15 * MINUTE_MS,
    maxRevisionHistory: 25,
    autoSaveIntervalSeconds: 30,
  },
  retention: { auditDays: 730 },
  maintenance: { enabled: false },
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function policyFromSettings(settings: PlatformSettings): PlatformPolicy {
  const d = SAFE_DEFAULT_POLICY;
  const { security, media, publishing, maintenance } = settings;

  const absoluteTtlMs =
    clampInt(security?.sessionTtlHours, 1, 720, d.session.absoluteTtlMs / HOUR_MS) * HOUR_MS;

  const requested = Array.isArray(media?.allowedMimeTypes)
    ? media.allowedMimeTypes.map((mime) => String(mime).toLowerCase().trim())
    : [];
  const allowedMimeTypes = MEDIA_MIME_ALLOWLIST.filter((mime) => requested.includes(mime));

  return {
    login: {
      maxAttempts: clampInt(security?.maxLoginAttempts, 1, 20, d.login.maxAttempts),
      lockoutMs:
        clampInt(security?.lockoutDurationMinutes, 1, 1440, d.login.lockoutMs / MINUTE_MS) *
        MINUTE_MS,
    },
    session: {
      absoluteTtlMs,
      idleTimeoutMs: Math.min(MAX_IDLE_TIMEOUT_MS, absoluteTtlMs),
    },
    password: {
      // Never below 8, whatever is stored.
      minLength: clampInt(security?.passwordMinLength, 8, 64, d.password.minLength),
      requireStrong:
        typeof security?.requireStrongPasswords === 'boolean'
          ? security.requireStrongPasswords
          : d.password.requireStrong,
    },
    media: {
      maxUploadBytes: clampInt(
        media?.maxUploadSizeBytes,
        1,
        MEDIA_UPLOAD_HARD_LIMIT_BYTES,
        d.media.maxUploadBytes,
      ),
      // An empty or unknown list falls back to the safe default, never to "anything".
      allowedMimeTypes: allowedMimeTypes.length > 0 ? allowedMimeTypes : d.media.allowedMimeTypes,
    },
    publishing: {
      defaultPostStatus: publishing?.defaultPostStatus === 'in_review' ? 'in_review' : 'draft',
      previewTokenTtlMs:
        clampInt(
          publishing?.previewTokenTtlMinutes,
          5,
          1440,
          d.publishing.previewTokenTtlMs / MINUTE_MS,
        ) * MINUTE_MS,
      maxRevisionHistory: clampInt(
        publishing?.maxRevisionHistory,
        1,
        100,
        d.publishing.maxRevisionHistory,
      ),
      autoSaveIntervalSeconds: clampInt(
        publishing?.autoSaveIntervalSeconds,
        5,
        300,
        d.publishing.autoSaveIntervalSeconds,
      ),
    },
    retention: {
      // Audit history never drops below one year.
      auditDays: clampInt(maintenance?.auditRetentionDays, 365, 3650, d.retention.auditDays),
    },
    maintenance: { enabled: maintenance?.maintenanceMode === true },
  };
}

/**
 * Password rule from the policy. Returns the i18n key of the first failure,
 * or null when the password is acceptable.
 */
export function passwordPolicyViolation(
  password: string,
  policy: PlatformPolicy['password'],
): 'auth.passwordTooShort' | 'auth.passwordTooWeak' | null {
  if (password.length < policy.minLength) return 'auth.passwordTooShort';
  if (
    policy.requireStrong &&
    !(/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password))
  ) {
    return 'auth.passwordTooWeak';
  }
  return null;
}
