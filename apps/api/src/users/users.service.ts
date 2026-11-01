import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { PaginatedResult, UserItem, UserRoleSummary } from '@multi-site-cms/types';
import { type DataSource, type Repository } from 'typeorm';

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
import { type AssignRoleDto } from './dto/assign-role.dto';
import { type CreateUserDto } from './dto/create-user.dto';
import { type ListUsersQueryDto } from './dto/list-users-query.dto';
import { type UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

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

    const userItems = await Promise.all(users.map((u) => this.toUserItem(u)));

    return {
      items: userItems,
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
    return this.toUserItem(user);
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

    return this.toUserItem(user);
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    const userRepo = await this.getUserRepo();
    const user = await userRepo.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
    }

    // Invariant: cannot deactivate/suspend the last active Super Admin
    if (
      dto.status &&
      dto.status !== 'active' &&
      user.status === 'active' &&
      (await this.isUserSuperAdmin(user.id))
    ) {
      const activeSuperAdminCount = await this.countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.lastSuperAdmin');
      }
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName.trim();
    }

    if (dto.status !== undefined) {
      user.status = dto.status;
      if (dto.status !== 'active') {
        // Immediately revoke all active sessions
        await this.sessionService.revokeAllUserSessions(user.id);
      }
    }

    if (dto.password) {
      user.passwordHash = await this.passwordService.hash(dto.password);
      // Revoke sessions to require re-login with new password
      await this.sessionService.revokeAllUserSessions(user.id);
    }

    await userRepo.save(user);

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

    return this.toUserItem(user);
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

    return this.toUserItem(user);
  }

  async revokeRole(
    userId: string,
    assignmentId: string,
    actorContext: EffectiveAuthContext,
    requestId?: string,
  ): Promise<UserItem> {
    const userRepo = await this.getUserRepo();
    const assignmentRepo = await this.getAssignmentRepo();

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'user.notFound');
    }

    const assignment = await assignmentRepo.findOne({
      where: { id: assignmentId, userId: user.id },
      relations: { role: true },
    });

    if (!assignment) {
      throw new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', 'role.assignmentNotFound');
    }

    // Invariant: Only Super Admin can revoke a super_admin role
    if (assignment.role.key === 'super_admin') {
      if (!actorContext.isSuperAdmin) {
        throw new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', 'auth.roleNotAssignable');
      }

      // Invariant: cannot remove the last active Super Admin
      const activeSuperAdminCount = await this.countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        throw new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', 'auth.lastSuperAdmin');
      }
    }

    await assignmentRepo.delete(assignment.id);

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

    return this.toUserItem(user);
  }

  private async isUserSuperAdmin(userId: string): Promise<boolean> {
    const assignmentRepo = await this.getAssignmentRepo();
    const assignment = await assignmentRepo
      .createQueryBuilder('ura')
      .innerJoin('ura.role', 'role')
      .where('ura.userId = :userId', { userId })
      .andWhere('role.key = :key', { key: 'super_admin' })
      .getOne();

    return Boolean(assignment);
  }

  private async countActiveSuperAdmins(): Promise<number> {
    const assignmentRepo = await this.getAssignmentRepo();
    const count = await assignmentRepo
      .createQueryBuilder('ura')
      .innerJoin('ura.role', 'role')
      .innerJoin('ura.user', 'user')
      .where('role.key = :key', { key: 'super_admin' })
      .andWhere('user.status = :status', { status: 'active' })
      .getCount();

    return count;
  }

  private async toUserItem(user: User): Promise<UserItem> {
    const assignmentRepo = await this.getAssignmentRepo();
    const assignments = await assignmentRepo.find({
      where: { userId: user.id },
      relations: { role: true },
    });

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
