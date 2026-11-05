import { describe, expect, it } from 'vitest';

import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('uses the message of a platform API error', () => {
    expect(apiErrorMessage({ status: 409, code: 'CONFLICT', message: 'Slug taken.' }, 'x')).toBe(
      'Slug taken.',
    );
  });

  it('falls back for empty, missing, or non-string messages', () => {
    expect(apiErrorMessage({ message: '  ' }, 'Failed.')).toBe('Failed.');
    expect(apiErrorMessage({ message: 42 }, 'Failed.')).toBe('Failed.');
    expect(apiErrorMessage(null, 'Failed.')).toBe('Failed.');
    expect(apiErrorMessage('boom', 'Failed.')).toBe('Failed.');
  });
});
