import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult, UserItem, UserRoleSummary } from '@multi-site-cms/types';
import { In, type DataSource, type EntityManager, type Repository } from 'typeorm';

import { PasswordService } from '../auth/services/password.service';
import { SessionService } from '../auth/services/session.service';
import type { EffectiveAuthContext } from '../auth/services/authorization.service';
import { AuditService } from '../common/audit/audit.service';
import { ApiException } from '../common/exceptions/api.exception';
import { getInitializedRepository } from '../database/ensure-connected';
import { DATA_SOURCE } from '../database/database.tokens';
import { Role } from '../database/entities/role.entity';
import { Site } from '../database/entities/site.entity';
import { UserRoleAssignment } from '../database/entities/user-role-assignment.entity';
import { User } from '../database/entities/user.entity';
import { passwordPolicyViolation } from '../settings/platform-policy';
import { SettingsService } from '../settings/settings.service';
import { type AssignRoleDto } from './dto/assign-role.dto';
import { type CreateUserDto } from './dto/create-user.dto';
import { type ListUsersQueryDto } from './dto/list-users-query.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

/**
 * Advisory lock serializing every change that can reduce the number of active
 * Super Admins. Without it, two concurrent requests could each see "two
 * remain", both proceed, and leave the platform with none.
 */
const SUPER_ADMIN_INVARIANT_LOCK = 7_316_002;

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
    private readonly settingsService: SettingsService,
  ) {}

  /** Password rules from platform settings (Security: minimum length, strength). */
  private async assertPasswordAllowed(password: string): Promise<void> {
    const { password: policy } = await this.settingsService.getPolicy();
    const violation = passwordPolicyViolation(password, policy);
    if (violation) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', violation);
    }
  }

  private async getUserRepo(): Promise<Repository<User>> {
    return getInitializedRepository(this.dataSource, User);
  }

  private async getRoleRepo(): Promise<Repository<Role>> {
    return getInitializedRepository(this.dataSource, Role);
  }

  private async getAssignmentRepo(): Promise<Repository<UserRoleAssignment>> {
    return getInitializedRepository(this.dataSource, UserRoleAssignment);
  }

  private async getSiteRepo(): Promise<Repository<Site>> {
    return getInitializedRepository(this.dataSource, Site);
  }

  async listUsers(query: ListUsersQueryDto): Promise<PaginatedResult<UserItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const userRepo = await this.getUserRepo();
    const qb = userRepo.createQueryBuilder('user');

    if (query.status) {
      qb.where('user.status = :status', { status: query.status });
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await qb.getManyAndCount();

    // Roles of every user on the page in one query (was one query per user).
    const assignmentRepo = await this.getAssignmentRepo();
    const assignments =
      users.length > 0
        ? await assignmentRepo.find({
            where: { userId: In(users.map((u) => u.id)) },
            relations: { role: true },
          })
        : [];

    return {
      items: users.map((u) =>
        this.toUserItem(
          u,
          assignments.filter((a) => a.userId === u.id),
        ),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getUserById(id: string): Promise<UserItem> {
    const userRepo = await this.getUserRepo();
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
    }
    return this.loadUserItem(user);
  }

  async createUser(
    dto: CreateUserDto,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const userRepo = await this.getUserRepo();

    const existing = await userRepo.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ApiException(HttpStatus.CONFLICT, 'CONFLICT', 'user.emailConflict');
    }

    let passwordHash: string | null = null;
    if (dto.password) {
      await this.assertPasswordAllowed(dto.password);
      passwordHash = await this.passwordService.hash(dto.password);
    }

    const status = dto.status ?? (passwordHash ? 'active' : 'invited');

    const user = userRepo.create({
      email: normalizedEmail,
      displayName: dto.displayName.trim(),
      passwordHash,
      status,
      failedLoginCount: 0,
      lockedUntil: null,
    });

    await userRepo.save(user);

    await this.auditService.record({
      actorId: actorContext.user.id,
      actorType: 'user',
      action: 'user.created',
      entityType: 'user',
      entityId: user.id,
      requestId,
      metadata: { email: user.email, status: user.status },
    });

    return this.loadUserItem(user);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    if (dto.password) await this.assertPasswordAllowed(dto.password);
    // Hash outside the transaction: it is slow and needs no database state.
    const newPasswordHash = dto.password ? await this.passwordService.hash(dto.password) : null;

    const user = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const target = await users.findOne({ where: { id } });
      if (!target) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
      }

      // Invariant: the last active Super Admin cannot be deactivated.
      const deactivating =
        dto.status !== undefined && dto.status !== 'active' && target.status === 'active';
      if (deactivating && (await this.isUserSuperAdmin(manager, target.id))) {
        await this.assertAnotherActiveSuperAdmin(manager);
      }

      if (dto.displayName !== undefined) {
        target.displayName = dto.displayName.trim();
      }
      if (dto.status !== undefined) {
        target.status = dto.status;
      }
      if (newPasswordHash) {
        target.passwordHash = newPasswordHash;
      }

      return users.save(target);
    });

    // A deactivated account or a changed password must sign in again.
    if ((dto.status !== undefined && dto.status !== 'active') || newPasswordHash) {
      await this.sessionService.revokeAllUserSessions(user.id);
    }

    await this.auditService.record({
      actorId: actorContext.user.id,
      actorType: 'user',
      action: 'user.updated',
      entityType: 'user',
      entityId: user.id,
      requestId,
      metadata: {
        updatedFields: Object.keys(dto),
      },
    });

    return this.loadUserItem(user);
  }

  async assignRole(
    userId: string,
    dto: AssignRoleDto,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    const userRepo = await this.getUserRepo();
    const roleRepo = await this.getRoleRepo();
    const assignmentRepo = await this.getAssignmentRepo();
    const siteRepo = await this.getSiteRepo();

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
    }

    const role = await roleRepo.findOne({ where: { key: dto.roleKey } });
    if (!role) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'role.notFound');
    }

    // Invariant: Only Super Admin can assign the super_admin role
    if (role.key === 'super_admin' && !actorContext.isSuperAdmin) {
      throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.roleNotAssignable');
    }

    // Invariant: Scope validation
    if (role.scopeType === 'platform') {
      if (dto.siteId) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.siteForbidden');
      }
    } else if (role.scopeType === 'site') {
      if (!dto.siteId) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.siteRequired');
      }

      const site = await siteRepo.findOne({ where: { id: dto.siteId } });
      if (!site) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'auth.siteNotFound');
      }

      // Ordinary Admin can only assign access to sites they themselves have access to
      if (!actorContext.isSuperAdmin && !actorContext.authorizedSiteIds.includes(dto.siteId)) {
        throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.roleNotAssignable');
      }
    }

    // Check existing assignment (idempotent)
    const existing = await assignmentRepo.findOne({
      where: {
        userId: user.id,
        roleId: role.id,
        siteId: dto.siteId ?? undefined,
      },
    });

    if (!existing) {
      const assignment = assignmentRepo.create({
        userId: user.id,
        roleId: role.id,
        scopeType: role.scopeType,
        siteId: dto.siteId ?? null,
        createdBy: actorContext.user.id,
      });
      await assignmentRepo.save(assignment);

      await this.auditService.record({
        actorId: actorContext.user.id,
        actorType: 'user',
        siteId: dto.siteId ?? null,
        action: 'role.assigned',
        entityType: 'user_role_assignment',
        entityId: assignment.id,
        requestId,
        metadata: {
          targetUserId: user.id,
          roleKey: role.key,
          scopeType: role.scopeType,
          siteId: dto.siteId ?? null,
        },
      });
    }

    return this.loadUserItem(user);
  }

  async revokeRole(
    userId: string,
    assignmentId: string,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    const { user, assignment } = await this.dataSource.transaction(async (manager) => {
      const target = await manager.getRepository(User).findOne({ where: { id: userId } });
      if (!target) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
      }

      const assignments = manager.getRepository(UserRoleAssignment);
      const found = await assignments.findOne({
        where: { id: assignmentId, userId: target.id },
        relations: { role: true },
      });
      if (!found) {
        throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'role.assignmentNotFound');
      }

      if (found.role.key === 'super_admin') {
        // Invariant: only a Super Admin can revoke a super_admin role.
        if (!actorContext.isSuperAdmin) {
          throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.roleNotAssignable');
        }
        // Invariant: the last active Super Admin keeps the role. Revoking it
        // from an inactive account never reduces the active count.
        if (target.status === 'active') {
          await this.assertAnotherActiveSuperAdmin(manager);
        }
      }

      await assignments.delete(found.id);
      return { user: target, assignment: found };
    });

    await this.auditService.record({
      actorId: actorContext.user.id,
      actorType: 'user',
      siteId: assignment.siteId,
      action: 'role.revoked',
      entityType: 'user_role_assignment',
      entityId: assignment.id,
      requestId,
      metadata: {
        targetUserId: user.id,
        roleKey: assignment.role.key,
        siteId: assignment.siteId,
      },
    });

    return this.loadUserItem(user);
  }

  /**
   * Fails unless at least one other active Super Admin remains. Takes the
   * invariant lock first, so the count reflects every concurrent change that
   * committed before this transaction got the lock.
   */
  private async assertAnotherActiveSuperAdmin(manager: EntityManager): Promise<void> {
    await manager.query('SELECT pg_advisory_xact_lock($1)', [SUPER_ADMIN_INVARIANT_LOCK]);
    if ((await this.countActiveSuperAdmins(manager)) <= 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.lastSuperAdmin');
    }
  }

  private async isUserSuperAdmin(manager: EntityManager, userId: string): Promise<boolean> {
    const assignment = await manager
      .getRepository(UserRoleAssignment)
      .createQueryBuilder('ura')
      .innerJoin('ura.role', 'role')
      .where('ura.userId = :userId', { userId })
      .andWhere('role.key = :key', { key: 'super_admin' })
      .getOne();

    return Boolean(assignment);
  }

  private async countActiveSuperAdmins(manager: EntityManager): Promise<number> {
    return manager
      .getRepository(UserRoleAssignment)
      .createQueryBuilder('ura')
      .innerJoin('ura.role', 'role')
      .innerJoin('ura.user', 'user')
      .where('role.key = :key', { key: 'super_admin' })
      .andWhere('user.status = :status', { status: 'active' })
      .getCount();
  }

  private async loadUserItem(user: User): Promise<UserItem> {
    const assignmentRepo = await this.getAssignmentRepo();
    const assignments = await assignmentRepo.find({
      where: { userId: user.id },
      relations: { role: true },
    });
    return this.toUserItem(user, assignments);
  }

  private toUserItem(user: User, assignments: UserRoleAssignment[]): UserItem {
    const roles: UserRoleSummary[] = assignments.map((a) => ({
      assignmentId: a.id,
      roleId: a.role.id,
      roleKey: a.role.key,
      roleName: a.role.name,
      scopeType: a.scopeType,
      siteId: a.siteId,
    }));

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      failedLoginCount: user.failedLoginCount,
      lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      roles,
    };
  }
}
