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
