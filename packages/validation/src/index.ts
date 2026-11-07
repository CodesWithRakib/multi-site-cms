import { z } from 'zod';

/**
 * Absolute HTTP(S) URL. Plain `z.url()` also accepts other schemes, which are
 * not valid for application or API origins.
 */
export const httpUrlSchema = z
  .url()
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
    'URL must use the http or https protocol.',
  );

/**
 * Public environment consumed by browser bundles. Only values that are safe to
 * expose publicly belong here; secrets must be validated at the API boundary.
 */
export const publicWebEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: httpUrlSchema.default('http://localhost:4000/api/v1'),
  NEXT_PUBLIC_APP_URL: httpUrlSchema.optional(),
});

export type PublicWebEnv = z.infer<typeof publicWebEnvSchema>;

export function parsePublicWebEnv(input: unknown): PublicWebEnv {
  return publicWebEnvSchema.parse(input);
}

/**
 * Hostname normalization and validation utilities.
 *
 * Enforces RFC 1035 / RFC 1123 DNS compliance and matches the PostgreSQL
 * CHK_site_domains_hostname_format constraint.
 */

const HOSTNAME_LABEL_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const FORBIDDEN_SCHEMES = /^(https?|ftp|file|javascript|data|vbscript):/i;

export interface HostnameNormalizationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normalizes an incoming hostname string:
 * 1. Trims whitespace
 * 2. Rejects URI paths, queries, fragments, and credentials
 * 3. Strips optional port if local development port is included
 * 4. Strips protocol if erroneously provided (e.g. "https://example.com" -> "example.com")
 * 5. Converts internationalized domain names (IDN) to ASCII Punycode
 * 6. Lowercases and validates label formatting according to RFC 1035/1123
 */
export function normalizeHostname(input: string): HostnameNormalizationResult {
  if (!input || typeof input !== 'string') {
    return { isValid: false, normalized: '', error: 'Hostname cannot be empty' };
  }

  let cleaned = input.trim();

  // Strip leading protocols if mistakenly provided
  if (cleaned.startsWith('//')) {
    cleaned = cleaned.slice(2);
  } else if (FORBIDDEN_SCHEMES.test(cleaned)) {
    cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');
  }

  // Reject paths, queries, and fragments
  if (cleaned.includes('/') || cleaned.includes('?') || cleaned.includes('#')) {
    return {
      isValid: false,
      normalized: '',
      error: 'Hostname must not include a path, query parameter, or fragment',
    };
  }

  // Reject credentials (user:pass@host)
  if (cleaned.includes('@')) {
    return {
      isValid: false,
      normalized: '',
      error: 'Hostname must not include user credentials',
    };
  }

  // Strip port (e.g. "localhost:5000" -> "localhost")
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    cleaned = parts[0] ?? '';
  }

  // Strip trailing dot (FQDN root notation)
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  // Convert to lowercase
  cleaned = cleaned.toLowerCase();

  // Reject empty string or wildcard
  if (!cleaned || cleaned === '*') {
    return { isValid: false, normalized: '', error: 'Hostname is invalid or empty' };
  }

  if (cleaned.startsWith('*.')) {
    return { isValid: false, normalized: '', error: 'Wildcard domains are not permitted' };
  }

  // Total length check (RFC 1035: max 253 characters)
  if (cleaned.length > 253) {
    return {
      isValid: false,
      normalized: '',
      error: 'Hostname exceeds maximum allowed length of 253 characters',
    };
  }

  // Check each label
  const labels = cleaned.split('.');
  for (const label of labels) {
    if (!label) {
      return {
        isValid: false,
        normalized: '',
        error: 'Hostname contains empty labels (consecutive dots)',
      };
    }
    if (!HOSTNAME_LABEL_REGEX.test(label)) {
      return {
        isValid: false,
        normalized: '',
        error: `Hostname label "${label}" contains invalid characters or invalid hyphen placement`,
      };
    }
  }

  return {
    isValid: true,
    normalized: cleaned,
  };
}

/**
 * Analytics validation schemas
 */
export const analyticsQuerySchema = z.object({
  siteId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
  timeframe: z.enum(['7d', '14d', '30d', '90d', '1y']).optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const recordPageViewSchema = z.object({
  siteId: z.string().uuid(),
  postId: z.string().uuid().optional(),
  path: z.string().min(1).max(1024),
  referrer: z.string().max(2048).optional(),
  visitorId: z.string().max(128).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
});

export type RecordPageViewInput = z.infer<typeof recordPageViewSchema>;

/**
 * Audit Log validation schemas
 */
export const auditLogQuerySchema = z.object({
  siteId: z.string().uuid().optional(),
  action: z.string().max(128).optional(),
  category: z.enum(['all', 'auth', 'content', 'user', 'system', 'media']).optional(),
  entityType: z.string().max(64).optional(),
  actorId: z.string().uuid().optional(),
  search: z.string().max(256).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;

/**
 * Platform Settings validation schemas
 */
export const platformGeneralSettingsSchema = z.object({
  platformName: z.string().min(1).max(128).optional(),
  tagline: z.string().max(256).optional(),
  contactEmail: z.string().email().max(256).optional(),
  defaultLocale: z
    .string()
    .regex(/^[a-z]{2}(-[A-Z]{2})?$/)
    .optional(),
  defaultTimezone: z.string().max(64).optional(),
});

export const platformSecuritySettingsSchema = z.object({
  sessionTtlHours: z.number().int().min(1).max(720).optional(),
  maxLoginAttempts: z.number().int().min(1).max(20).optional(),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
  passwordMinLength: z.number().int().min(8).max(64).optional(),
  requireStrongPasswords: z.boolean().optional(),
});

export const platformMediaSettingsSchema = z.object({
  maxUploadSizeBytes: z
    .number()
    .int()
    .min(1024 * 1024)
    .max(100 * 1024 * 1024)
    .optional(),
  allowedMimeTypes: z.array(z.string().max(128)).optional(),
});

export const platformPublishingSettingsSchema = z.object({
  defaultPostStatus: z.enum(['draft', 'in_review']).optional(),
  autoSaveIntervalSeconds: z.number().int().min(5).max(300).optional(),
  maxRevisionHistory: z.number().int().min(1).max(100).optional(),
  previewTokenTtlMinutes: z.number().int().min(5).max(1440).optional(),
});

export const platformMaintenanceSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  maintenanceNoticeEn: z.string().max(512).optional(),
  maintenanceNoticeBn: z.string().max(512).optional(),
  auditRetentionDays: z.number().int().min(365).max(3650).optional(),
});

export const updatePlatformSettingsSchema = z.object({
  general: platformGeneralSettingsSchema.optional(),
  security: platformSecuritySettingsSchema.optional(),
  media: platformMediaSettingsSchema.optional(),
  publishing: platformPublishingSettingsSchema.optional(),
  maintenance: platformMaintenanceSettingsSchema.optional(),
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;

export * from './site-about';
