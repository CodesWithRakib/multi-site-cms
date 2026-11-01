import { httpUrlSchema, publicWebEnvSchema } from '@multi-site-cms/validation';

export const APP_NAME = 'Multi-Site CMS';
export const API_PREFIX = '/api/v1';
export const DEFAULT_LOCALE = 'en';
export const DEFAULT_TIMEZONE = 'UTC';

export interface PublicWebConfig {
  apiBaseUrl: string;
  appUrl: string;
}

export interface PublicWebConfigOptions {
  /**
   * Local development fallback. Production deployments should provide
   * NEXT_PUBLIC_APP_URL explicitly.
   */
  appUrlFallback: string;
}

export interface PublicWebEnvInput {
  NEXT_PUBLIC_API_URL?: string | undefined;
  NEXT_PUBLIC_APP_URL?: string | undefined;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Validate the public browser environment once at the application boundary and
 * return normalized absolute URLs. The API base URL is expected to include the
 * versioned API prefix (for example, `https://api.example.com/api/v1`).
 */
export function createPublicWebConfig(
  input: PublicWebEnvInput,
  options: PublicWebConfigOptions,
): PublicWebConfig {
  const env = publicWebEnvSchema.parse({
    NEXT_PUBLIC_API_URL: input.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: input.NEXT_PUBLIC_APP_URL,
  });

  const appUrl = httpUrlSchema.parse(env.NEXT_PUBLIC_APP_URL ?? options.appUrlFallback);

  return Object.freeze({
    apiBaseUrl: trimTrailingSlash(env.NEXT_PUBLIC_API_URL),
    appUrl: trimTrailingSlash(appUrl),
  });
}
