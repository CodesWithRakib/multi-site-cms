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

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://localhost:3001,http://localhost:3002')
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid API environment configuration:\n${issues}`);
}

export type Env = z.infer<typeof envSchema>;
export const env: Env = parsedEnv.data;
