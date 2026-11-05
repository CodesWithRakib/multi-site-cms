import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { AuthUser } from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

import { AuditService } from '../../common/audit/audit.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { getInitializedRepository } from '../../database/ensure-connected';
import { DATA_SOURCE } from '../../database/database.tokens';
import { User } from '../../database/entities/user.entity';
import { passwordPolicyViolation } from '../../settings/platform-policy';
import { SettingsService } from '../../settings/settings.service';
import { AuthorizationService } from './authorization.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

export interface LoginResult {
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
  user: AuthUser;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly authorizationService: AuthorizationService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  private async getUserRepo(): Promise<Repository<User>> {
    return getInitializedRepository(this.dataSource, User);
  }

  /**
   * Authenticates a user with email and password.
   * Enforces brute-force lockout, non-enumerating generic errors, constant-time dummy verify,
   * session rotation, and audit recording.
   */
  async login(options: {
    email: string;
    password: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    oldSessionToken?: string | null;
    requestId?: string | null;
  }): Promise<LoginResult> {
    const normalizedEmail = options.email.trim().toLowerCase();
    const userRepo = await this.getUserRepo();

    // Explicitly select passwordHash which is hidden by default
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      // Mitigate timing difference on non-existent account
      await this.passwordService.verify(
        '$argon2id$v=19$m=19456,t=2,p=1$dummySaltForTimingMitigation$dummyHashResult',
        options.password,
      );

      await this.auditService.record({
        actorType: 'system',
        action: 'auth.failed_login',
        entityType: 'user',
        ipAddress: options.ipAddress,
        requestId: options.requestId,
        metadata: { reason: 'not_found' },
      });

      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'auth.invalidCredentials');
    }

    const now = new Date();

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > now) {
      await this.auditService.record({
        actorId: user.id,
        actorType: 'user',
        action: 'auth.failed_login',
        entityType: 'user',
        entityId: user.id,
        ipAddress: options.ipAddress,
        requestId: options.requestId,
        metadata: { reason: 'locked' },
      });

      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.accountLocked');
    }

    // Fail closed on suspended/disabled/invited accounts
    if (user.status !== 'active') {
      await this.auditService.record({
        actorId: user.id,
        actorType: 'user',
        action: 'auth.failed_login',
        entityType: 'user',
        entityId: user.id,
        ipAddress: options.ipAddress,
        requestId: options.requestId,
        metadata: { reason: 'inactive', status: user.status },
      });

      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.accountInactive');
    }

    if (!user.passwordHash) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'auth.invalidCredentials');
    }

    const isValidPassword = await this.passwordService.verify(user.passwordHash, options.password);

    if (!isValidPassword) {
      // Lockout thresholds come from platform settings (Security).
      const { login } = await this.settingsService.getPolicy();
      // Atomic increment: concurrent wrong guesses cannot undercount, so the
      // lockout cannot be outrun by sending attempts in parallel.
      const [updatedRows] = (await this.dataSource.query(
        `UPDATE "users"
            SET "failed_login_count" = "failed_login_count" + 1,
                "locked_until" = CASE
                  WHEN "failed_login_count" + 1 >= $2 THEN $3::timestamptz
                  ELSE "locked_until"
                END
          WHERE "id" = $1
          RETURNING "failed_login_count" AS "failedLoginCount"`,
        [user.id, login.maxAttempts, new Date(now.getTime() + login.lockoutMs)],
      )) as [Array<{ failedLoginCount: number }>, number];
      user.failedLoginCount = updatedRows[0]?.failedLoginCount ?? user.failedLoginCount + 1;

      await this.auditService.record({
        actorId: user.id,
        actorType: 'user',
        action: 'auth.failed_login',
        entityType: 'user',
        entityId: user.id,
        ipAddress: options.ipAddress,
        requestId: options.requestId,
        metadata: { failedAttempts: user.failedLoginCount },
      });

      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'auth.invalidCredentials');
    }

    // Password successful: reset lockout and update login timestamp
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = now;
    await userRepo.save(user);

    // Create session (rotating away old token)
    const { rawToken, expiresAt } = await this.sessionService.createSession({
      userId: user.id,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      oldRawToken: options.oldSessionToken,
    });

    const csrfToken = this.sessionService.generateCsrfToken();
    const authContext = await this.authorizationService.resolveUserAccess(user);
    const authUser = this.authorizationService.toAuthUser(authContext);

    await this.auditService.record({
      actorId: user.id,
      actorType: 'user',
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      ipAddress: options.ipAddress,
      requestId: options.requestId,
      metadata: { isSuperAdmin: authContext.isSuperAdmin },
    });

    return {
      sessionToken: rawToken,
      csrfToken,
      expiresAt,
      user: authUser,
    };
  }

  /**
   * Self-service password change. Requires the current password, applies the
   * platform password policy, and signs the user out everywhere else.
   */
  async changePassword(options: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    currentRawToken: string;
    ipAddress?: string | null;
    requestId?: string | null;
  }): Promise<void> {
    const userRepo = await this.getUserRepo();
    const user = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: options.userId })
      .getOne();
    if (!user?.passwordHash) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', 'auth.sessionExpired');
    }

    const currentOk = await this.passwordService.verify(user.passwordHash, options.currentPassword);
    if (!currentOk) {
      await this.auditService.record({
        actorId: user.id,
        actorType: 'user',
        action: 'auth.password_change_failed',
        entityType: 'user',
        entityId: user.id,
        ipAddress: options.ipAddress,
        requestId: options.requestId,
        metadata: { reason: 'wrong_current_password' },
      });
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'auth.currentPasswordInvalid',
      );
    }
    if (options.newPassword === options.currentPassword) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.passwordUnchanged');
    }

    const { password: policy } = await this.settingsService.getPolicy();
    const violation = passwordPolicyViolation(options.newPassword, policy);
    if (violation) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', violation);
    }

    user.passwordHash = await this.passwordService.hash(options.newPassword);
    await userRepo.save(user);
    await this.sessionService.revokeOtherUserSessions(user.id, options.currentRawToken);

    await this.auditService.record({
      actorId: user.id,
      actorType: 'user',
      action: 'auth.password_changed',
      entityType: 'user',
      entityId: user.id,
      ipAddress: options.ipAddress,
      requestId: options.requestId,
      metadata: { otherSessionsRevoked: true },
    });
  }

  /**
   * Logs out the user by explicitly revoking the session and auditing the event.
   */
  async logout(options: {
    rawToken: string;
    userId?: string | null;
    ipAddress?: string | null;
    requestId?: string | null;
  }): Promise<void> {
    await this.sessionService.revokeSession(options.rawToken);

    await this.auditService.record({
      actorId: options.userId ?? null,
      actorType: options.userId ? 'user' : 'system',
      action: 'auth.logout',
      entityType: 'session',
      ipAddress: options.ipAddress,
      requestId: options.requestId,
    });
  }
}
