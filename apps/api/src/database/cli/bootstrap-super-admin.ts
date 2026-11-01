import 'reflect-metadata';

import { DataSource } from 'typeorm';

import { env } from '../../config/env';
import { buildDataSourceOptions } from '../database-options';
import { AuditEvent } from '../entities/audit-event.entity';
import { Role } from '../entities/role.entity';
import { UserRoleAssignment } from '../entities/user-role-assignment.entity';
import { User } from '../entities/user.entity';
import * as argon2 from '@node-rs/argon2';

/**
 * Super Admin Bootstrap CLI Task.
 *
 * Implements ADR-0012: Controlled Super Admin provisioning.
 * - Operator-executed CLI command only (no HTTP route).
 * - Requires explicit credentials via environment or arguments.
 * - Idempotent for the designated email.
 * - Refuses execution if a different Super Admin already exists.
 * - Writes an immutable bootstrap audit event.
 */

export interface BootstrapSuperAdminOptions {
  email: string;
  password: string;
  displayName?: string;
  dataSourceUrl?: string;
}

export async function bootstrapSuperAdmin(
  options: BootstrapSuperAdminOptions,
  customDataSource?: DataSource,
): Promise<{ success: boolean; userId: string; alreadyExisted: boolean }> {
  const email = options.email.trim().toLowerCase();
  const password = options.password;
  const displayName = options.displayName?.trim() || 'Super Admin';

  if (!email || !email.includes('@')) {
    throw new Error('A valid email address is required for Super Admin bootstrap.');
  }

  if (!password || password.length < 12) {
    throw new Error('Super Admin password must be at least 12 characters.');
  }

  const dataSource =
    customDataSource ??
    new DataSource(buildDataSourceOptions(options.dataSourceUrl ?? env.DATABASE_URL));

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepo = queryRunner.manager.getRepository(User);
    const roleRepo = queryRunner.manager.getRepository(Role);
    const assignmentRepo = queryRunner.manager.getRepository(UserRoleAssignment);
    const auditRepo = queryRunner.manager.getRepository(AuditEvent);

    // 1. Fetch super_admin platform role
    const superAdminRole = await roleRepo.findOne({
      where: { key: 'super_admin', scopeType: 'platform' },
    });

    if (!superAdminRole) {
      throw new Error(
        'The super_admin role does not exist in the database. Ensure migrations and seeds have run.',
      );
    }

    // 2. Check if any active super admin already exists
    const existingSuperAdminAssignment = await assignmentRepo
      .createQueryBuilder('ura')
      .innerJoinAndSelect('ura.user', 'user')
      .where('ura.roleId = :roleId', { roleId: superAdminRole.id })
      .andWhere('ura.scopeType = :scopeType', { scopeType: 'platform' })
      .andWhere('user.status = :status', { status: 'active' })
      .getOne();

    if (existingSuperAdminAssignment) {
      if (existingSuperAdminAssignment.user.email.toLowerCase() === email) {
        // Idempotent: already provisioned
        await queryRunner.rollbackTransaction();
        return {
          success: true,
          userId: existingSuperAdminAssignment.user.id,
          alreadyExisted: true,
        };
      } else {
        throw new Error(
          `A different active Super Admin already exists (${existingSuperAdminAssignment.user.email}). Aborting bootstrap to prevent privilege hijacking.`,
        );
      }
    }

    // 3. Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      algorithm: 2, // Argon2id
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // 4. Create or update user record
    let user = await userRepo.findOne({ where: { email } });
    if (!user) {
      user = userRepo.create({
        email,
        displayName,
        passwordHash,
        status: 'active',
        failedLoginCount: 0,
        lockedUntil: null,
      });
      await userRepo.save(user);
    } else {
      user.displayName = displayName;
      user.passwordHash = passwordHash;
      user.status = 'active';
      user.failedLoginCount = 0;
      user.lockedUntil = null;
      await userRepo.save(user);
    }

    // 5. Assign super_admin role
    const assignment = assignmentRepo.create({
      userId: user.id,
      roleId: superAdminRole.id,
      scopeType: 'platform',
      siteId: null,
      createdBy: null,
    });
    await assignmentRepo.save(assignment);

    // 6. Record audit event
    const auditEvent = auditRepo.create({
      actorId: null,
      actorType: 'bootstrap',
      siteId: null,
      action: 'auth.bootstrap',
      entityType: 'user',
      entityId: user.id,
      requestId: null,
      ipAddress: null,
      metadata: {
        email: user.email,
        role: 'super_admin',
      },
    });
    await auditRepo.save(auditEvent);

    await queryRunner.commitTransaction();

    return {
      success: true,
      userId: user.id,
      alreadyExisted: false,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
    if (!customDataSource) {
      await dataSource.destroy();
    }
  }
}

async function runCli(): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const displayName = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.error(
      'Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required.',
    );
    console.error(
      'Usage: SUPER_ADMIN_EMAIL=admin@example.com SUPER_ADMIN_PASSWORD=... pnpm run bootstrap:super-admin',
    );
    process.exit(1);
  }

  try {
    const result = await bootstrapSuperAdmin({ email, password, displayName });
    if (result.alreadyExisted) {
      console.log(`[BOOTSTRAP] Super Admin account (${email}) is already provisioned.`);
    } else {
      console.log(`[BOOTSTRAP] Super Admin successfully provisioned with ID: ${result.userId}`);
    }
    process.exit(0);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[BOOTSTRAP ERROR] ${message}`);
    process.exit(1);
  }
}

if (
  process.argv[1]?.endsWith('bootstrap-super-admin.ts') ||
  process.argv[1]?.endsWith('bootstrap-super-admin.js')
) {
  void runCli();
}
