import { existsSync } from 'node:fs';
import { z } from 'zod';

// Load local development values before validation. Hosting platforms inject
// environment variables directly, so a missing file is expected in production.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const httpUrl = z
  .url()
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
    'URL must use the http or https protocol.',
  );

/** An empty value (e.g. `KEY=` copied from `.env.example`) counts as unset. */
function optionalSecret(minLength: number, name: string) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().min(minLength, `${name} must be at least ${minLength} characters.`).optional(),
  );
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  /**
   * Route prefix, without a leading slash. Kept as one segment group so the
   * version lives in configuration rather than in every controller.
   */
  API_PREFIX: z
    .string()
    .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/, 'API_PREFIX must be like "api/v1".')
    .default('api/v1'),
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5000,http://localhost:5001,http://localhost:5002,http://localhost:50001,http://localhost:50002',
    )
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    )
    .pipe(z.array(httpUrl).min(1, 'At least one CORS origin is required.')),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string.',
    )
    .default('postgresql://multi_site_cms:multi_site_cms_dev@localhost:5432/multi_site_cms'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  /** Maximum request body size, for example `512kb` or `1mb`. */
  BODY_LIMIT: z
    .string()
    .regex(/^\d{1,6}(b|kb|mb)$/i, 'BODY_LIMIT must look like "100kb" or "1mb".')
    .default('1mb'),
  /**
   * OpenAPI docs are always available outside production. In production they are
   * opt-in, because the API has no authentication yet and docs disclose the
   * surface area.
   */
  DOCS_ENABLED: z.enum(['true', 'false']).default('false'),
  /**
   * Public base URL of this API including the prefix, used to build absolute
   * media and preview links. Required (and non-localhost) in production.
   */
  API_BASE_URL: httpUrl
    .default('http://localhost:4000/api/v1')
    .transform((value) => value.replace(/\/+$/, '')),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  /**
   * HMAC key for draft preview tokens. Required in production. Outside
   * production a random per-process key is generated when it is absent, so a
   * token can never be forged from a value committed to the repository.
   */
  PREVIEW_TOKEN_SECRET: optionalSecret(32, 'PREVIEW_TOKEN_SECRET'),
  /**
   * Shared secret sent to the public sites' `POST /api/revalidate` webhook in
   * the `x-revalidate-secret` header. When absent, revalidation is skipped.
   */
  REVALIDATE_SECRET: optionalSecret(16, 'REVALIDATE_SECRET'),
  /**
   * Retention windows for the daily purge job (see docs/database/data-ownership.md).
   * Analytics keeps two years because the one-year view compares with the
   * previous year. Audit retention is a platform setting (Maintenance tab).
   */
  RETENTION_JOB_ENABLED: z.enum(['true', 'false']).default('true'),
  ANALYTICS_RETENTION_DAYS: z.coerce.number().int().min(30).max(3650).default(730),
  SESSION_RETENTION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  OUTBOX_RETENTION_DAYS: z.coerce.number().int().min(7).max(365).default(30),
  /**
   * Operator override for revalidation targets, `siteKey=url` pairs separated
   * by commas (e.g. `travel-blog=http://localhost:5001`). Takes precedence over
   * the site's verified primary domain. See ADR-0026.
   */
  SITE_REVALIDATE_URLS: z
    .string()
    .default('')
    .transform((value, ctx) => {
      const urls: Record<string, string> = {};
      for (const entry of value.split(',').map((part) => part.trim())) {
        if (entry === '') continue;
        const separator = entry.indexOf('=');
        const key = entry.slice(0, separator).trim();
        const url = entry.slice(separator + 1).trim();
        if (separator <= 0 || !/^[a-z0-9-]+$/.test(key) || !httpUrl.safeParse(url).success) {
          ctx.addIssue({
            code: 'custom',
            message:
              'SITE_REVALIDATE_URLS must look like "site-key=https://host,other=http://host:port".',
          });
          return z.NEVER;
        }
        urls[key] = url.replace(/\/+$/, '');
      }
      return urls;
    }),
});

export type Env = z.infer<typeof envSchema>;

export interface ApiConfig extends Env {
  readonly docsEnabled: boolean;
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');
}

export interface CloudinaryCredentials {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

/**
 * Resolves Cloudinary credentials from the explicit trio, falling back to
 * `CLOUDINARY_URL` (`cloudinary://<api_key>:<api_secret>@<cloud_name>`).
 * Returns null when they are incomplete; there are no built-in defaults.
 */
export function resolveCloudinaryCredentials(
  config: Pick<
    Env,
    'CLOUDINARY_URL' | 'CLOUDINARY_CLOUD_NAME' | 'CLOUDINARY_API_KEY' | 'CLOUDINARY_API_SECRET'
  >,
): CloudinaryCredentials | null {
  if (config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET) {
    return {
      cloudName: config.CLOUDINARY_CLOUD_NAME,
      apiKey: config.CLOUDINARY_API_KEY,
      apiSecret: config.CLOUDINARY_API_SECRET,
    };
  }

  if (!config.CLOUDINARY_URL) {
    return null;
  }

  try {
    const url = new URL(config.CLOUDINARY_URL);
    if (url.protocol !== 'cloudinary:' || !url.username || !url.password || !url.hostname) {
      return null;
    }
    return {
      cloudName: url.hostname,
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
    };
  } catch {
    return null;
  }
}

function isLocalhost(origin: string): boolean {
  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * Parse and validate configuration from an explicit environment object.
 *
 * Exported so tests can exercise invalid input without mutating `process.env` or
 * touching `.env`. Never include the parsed values in an error message: the object
 * contains a database URL with credentials.
 */
export function parseEnv(input: NodeJS.ProcessEnv): ApiConfig {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(`Invalid API environment configuration:\n${formatIssues(parsed.error)}`);
  }

  const config = parsed.data;

  if (config.STORAGE_PROVIDER === 'cloudinary' && !resolveCloudinaryCredentials(config)) {
    throw new Error(
      'Invalid API environment configuration:\nSTORAGE_PROVIDER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, or a valid CLOUDINARY_URL.',
    );
  }

  // Production must not silently inherit development defaults. `envSchema` applies
  // them, so the raw input is what proves intent.
  if (config.NODE_ENV === 'production') {
    const missing = (
      ['DATABASE_URL', 'CORS_ORIGINS', 'PREVIEW_TOKEN_SECRET', 'API_BASE_URL'] as const
    ).filter((key) => !input[key] || input[key]?.trim() === '');

    if (missing.length > 0) {
      throw new Error(
        `Invalid API environment configuration:\n${missing.join(', ')} must be set explicitly in production.`,
      );
    }

    const localOrigins = config.CORS_ORIGINS.filter(isLocalhost);
    if (localOrigins.length > 0) {
      throw new Error(
        'Invalid API environment configuration:\nCORS_ORIGINS must not contain localhost origins in production.',
      );
    }

    if (isLocalhost(config.API_BASE_URL)) {
      throw new Error(
        'Invalid API environment configuration:\nAPI_BASE_URL must not point to localhost in production.',
      );
    }
  }

  return Object.freeze({
    ...config,
    docsEnabled: config.NODE_ENV !== 'production' || config.DOCS_ENABLED === 'true',
  });
}

export const env: ApiConfig = parseEnv(process.env);
