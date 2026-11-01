import { describe, expect, it } from '@jest/globals';

import { PasswordService } from '../../src/auth/services/password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes passwords using Argon2id', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await service.hash(password);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');
  });

  it('verifies valid passwords correctly', async () => {
    const password = 'CorrectPassword123!';
    const hash = await service.hash(password);

    const isValid = await service.verify(hash, password);
    expect(isValid).toBe(true);
  });

  it('rejects invalid passwords', async () => {
    const hash = await service.hash('CorrectPassword123!');

    const isValid = await service.verify(hash, 'WrongPassword456!');
    expect(isValid).toBe(false);
  });

  it('returns false safely on corrupt hashes without throwing', async () => {
    const isValid = await service.verify('not-a-valid-argon2-hash', 'Password123!');
    expect(isValid).toBe(false);
  });
});
