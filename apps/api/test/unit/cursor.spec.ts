import { describe, expect, it } from '@jest/globals';

import { ApiException } from '../../src/common/exceptions/api.exception';
import { decodeIdCursor, encodeIdCursor } from '../../src/common/pagination/cursor';

describe('id cursor', () => {
  it('round-trips a bigint id without losing precision', () => {
    const id = '9007199254740993'; // above Number.MAX_SAFE_INTEGER
    expect(decodeIdCursor(encodeIdCursor(id))).toBe(id);
    expect(decodeIdCursor(encodeIdCursor(42))).toBe('42');
  });

  it('produces an opaque URL-safe token', () => {
    expect(encodeIdCursor('123')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['not base64 json', '%%%'],
    ['empty', ''],
    ['json without id', Buffer.from('{}').toString('base64url')],
    ['non-numeric id (SQL-ish)', Buffer.from('{"id":"1; DROP TABLE x"}').toString('base64url')],
    ['numeric id as number', Buffer.from('{"id":5}').toString('base64url')],
    ['negative id', Buffer.from('{"id":"-1"}').toString('base64url')],
    ['too long', Buffer.from(`{"id":"${'9'.repeat(30)}"}`).toString('base64url')],
  ])('rejects a malformed cursor (%s) with a 400', (_label, cursor) => {
    expect(() => decodeIdCursor(cursor)).toThrow(ApiException);
    try {
      decodeIdCursor(cursor);
    } catch (error) {
      expect((error as ApiException).getStatus()).toBe(400);
    }
  });
});
