import * as crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { type DataSource, IsNull, MoreThan, type Repository } from 'typeorm';

import { getInitializedRepository } from '../../database/ensure-connected';
import { DATA_SOURCE } from '../../database/database.tokens';
import { Session } from '../../database/entities/session.entity';
import { type User } from '../../database/entities/user.entity';

export const SESSION_COOKIE_NAME = 'cms_session';
export const CSRF_COOKIE_NAME = 'cms_csrf';

/** 7 days absolute session lifetime */
export const SESSION_ABSOLUTE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
/** 24 hours idle timeout */
export const SESSION_IDLE_TIMEOUT_MS = 24 * 60 * 60 * 1000;
/** 5 minutes touch throttle to avoid write amplification on read-heavy traffic */
export const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export interface SessionWithUser extends Session {
  user: User;
}

export interface CreatedSession {
  rawToken: string;
  session: Session;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  private async getSessionRepo(): Promise<Repository<Session>> {
    return getInitializedRepository(this.dataSource, Session);
  }

  /**
   * Hashes an opaque raw session token using SHA-256 for secure database storage.
   */
  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Generates a cryptographically random CSRF token.
   */
  generateCsrfToken(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  /**
   * Creates and persists a new server-side session.
   * Rotates away any existing session provided in `oldRawToken` to prevent session fixation.
   */
  async createSession(options: {
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    oldRawToken?: string | null;
  }): Promise<CreatedSession> {
    if (options.oldRawToken) {
      await this.revokeSession(options.oldRawToken);
    }

    const sessionRepo = await this.getSessionRepo();
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_LIFETIME_MS);

    const session = sessionRepo.create({
      userId: options.userId,
      tokenHash,
      ipAddress: options.ipAddress ?? null,
      userAgent: options.userAgent ?? null,
      createdAt: now,
      lastActiveAt: now,
      expiresAt,
      revokedAt: null,
    });

    await sessionRepo.save(session);

    return { rawToken, session, expiresAt };
  }

  /**
   * Validates a session token: verifies hash, expiration, revocation, and idle timeout.
   * If valid, optionally touches `last_active_at` with a 5-minute debounce.
   */
  async findValidSession(rawToken: string): Promise<SessionWithUser | null> {
    if (!rawToken || rawToken.trim() === '') {
      return null;
    }

    const sessionRepo = await this.getSessionRepo();
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const session = await sessionRepo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
      relations: { user: true },
    });

    if (!session || !session.user) {
      return null;
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastActiveAt.getTime();
    if (idleTime > SESSION_IDLE_TIMEOUT_MS) {
      session.revokedAt = now;
      await sessionRepo.save(session);
      return null;
    }

    // Debounced touch
    if (idleTime > SESSION_TOUCH_INTERVAL_MS) {
      session.lastActiveAt = now;
      await sessionRepo.update(session.id, { lastActiveAt: now });
    }

    return session as SessionWithUser;
  }

  /**
   * Explicitly revokes a single active session (e.g. user logout).
   */
  async revokeSession(rawToken: string): Promise<void> {
    if (!rawToken || rawToken.trim() === '') {
      return;
    }

    const sessionRepo = await this.getSessionRepo();
    const tokenHash = this.hashToken(rawToken);
    await sessionRepo.update({ tokenHash, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  /**
   * Revokes all active sessions for a given user (e.g. account suspension or password reset).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessionRepo = await this.getSessionRepo();
    await sessionRepo.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }
}
