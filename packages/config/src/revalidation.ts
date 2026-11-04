import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Contract for the on-demand ISR webhook exposed by every public site at
 * `POST /api/revalidate`. The API's outbox dispatcher is the only caller.
 *
 * Server-only: this module uses `node:crypto` and must never be imported from
 * a Client Component.
 */
export const REVALIDATE_SECRET_HEADER = 'x-revalidate-secret';

/** Upper bound on items per request, so one call cannot fan out unbounded work. */
export const MAX_REVALIDATION_ITEMS = 50;
const MAX_TAG_LENGTH = 256;
const MAX_PATH_LENGTH = 512;

export type RevalidationAuthResult = 'ok' | 'unconfigured' | 'invalid';

export interface RevalidationPayload {
  readonly paths: readonly string[];
  readonly tags: readonly string[];
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Fails closed: with no configured secret the webhook is unusable rather than
 * open. Hashing both sides gives equal-length buffers, so the comparison does
 * not leak the secret's length.
 */
export function verifyRevalidationSecret(
  provided: string | null | undefined,
  expected: string | undefined,
): RevalidationAuthResult {
  if (!expected) {
    return 'unconfigured';
  }
  if (!provided) {
    return 'invalid';
  }
  return timingSafeEqual(digest(provided), digest(expected)) ? 'ok' : 'invalid';
}

function isSafePath(value: string): boolean {
  return (
    value.length <= MAX_PATH_LENGTH &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !/[\s?#]/.test(value)
  );
}

function isSafeTag(value: string): boolean {
  return value.length > 0 && value.length <= MAX_TAG_LENGTH && !/\s/.test(value);
}

function readStringArray(value: unknown): string[] | null {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return null;
  }
  return value;
}

/**
 * Validates `{ paths?: string[], tags?: string[] }`. Returns null for any
 * malformed or oversized payload; callers answer 400.
 */
export function parseRevalidationPayload(body: unknown): RevalidationPayload | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  const paths = readStringArray(record.paths);
  const tags = readStringArray(record.tags);

  if (!paths || !tags || paths.length + tags.length > MAX_REVALIDATION_ITEMS) {
    return null;
  }
  if (!paths.every(isSafePath) || !tags.every(isSafeTag)) {
    return null;
  }

  return { paths: [...new Set(paths)], tags: [...new Set(tags)] };
}
