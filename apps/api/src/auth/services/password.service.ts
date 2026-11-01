import { Injectable } from '@nestjs/common';
import * as argon2 from '@node-rs/argon2';

/**
 * Password hashing and verification using Argon2id.
 *
 * Uses OWASP recommended parameters for Argon2id. Passwords are never stored
 * in plaintext or evaluated with naive string equality.
 */
@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password with Argon2id.
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      algorithm: 2, // Argon2id
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
  }

  /**
   * Verifies a plaintext password against a stored Argon2id hash.
   */
  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }
}
