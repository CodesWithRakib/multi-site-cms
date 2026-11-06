import { HttpStatus } from '@nestjs/common';

import { ApiException } from '../exceptions/api.exception';

/**
 * Opaque keyset cursors for append-only lists (audit log).
 *
 * A cursor is base64url(JSON) of the last row's sort key. It is opaque to
 * clients and validated strictly here, so a tampered cursor is a 400 and never
 * reaches SQL as anything but a bound numeric string.
 *
 * Why not OFFSET: on a table that keeps growing, `OFFSET n` rescans n rows and
 * pages shift while new rows arrive. `WHERE id < cursor` is index-bound and
 * stable.
 */
const ID_PATTERN = /^\d{1,19}$/;

function invalidCursor(): ApiException {
  return new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'validation.failed', {
    details: [{ field: 'cursor', code: 'INVALID_CURSOR', messageKey: 'validation.failed' }],
  });
}

/** Encodes the id of the last returned row (a bigint, kept as a string). */
export function encodeIdCursor(id: string | number | bigint): string {
  return Buffer.from(JSON.stringify({ id: String(id) }), 'utf8').toString('base64url');
}

/** Decodes a cursor back to the bigint id string; throws a 400 when malformed. */
export function decodeIdCursor(cursor: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw invalidCursor();
  }

  const id = (parsed as { id?: unknown } | null)?.id;
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) throw invalidCursor();
  return id;
}
