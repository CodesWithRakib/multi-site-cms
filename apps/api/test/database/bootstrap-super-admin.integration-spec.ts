import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { DataSource } from 'typeorm';

import { bootstrapSuperAdmin } from '../../src/database/cli/bootstrap-super-admin';
import { AuditEvent } from '../../src/database/entities/audit-event.entity';
import { UserRoleAssignment } from '../../src/database/entities/user-role-assignment.entity';
import { User } from '../../src/database/entities/user.entity';
import { createTestDataSource, resetTestSchema } from './test-database';

describe('Super Admin Bootstrap Integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await resetTestSchema(dataSource);

    // Ensure permissions and roles are present
    const roleRepo = dataSource.getRepository('roles');
    await roleRepo.save([
      { key: 'super_admin', name: 'Super Admin', scopeType: 'platform' },
      { key: 'admin', name: 'Admin', scopeType: 'site' },
    ]);
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('rejects passwords shorter than 12 characters', async () => {
    await expect(
      bootstrapSuperAdmin(
        {
          email: 'admin@example.test',
          password: 'short',
        },
        dataSource,
      ),
    ).rejects.toThrow(/at least 12 characters/);
  });

  it('rejects invalid email addresses', async () => {
    await expect(
      bootstrapSuperAdmin(
        {
          email: 'not-an-email',
          password: 'ValidPassword123!',
        },
        dataSource,
      ),
    ).rejects.toThrow(/valid email address/);
  });

  it('provisions the initial Super Admin successfully', async () => {
    const result = await bootstrapSuperAdmin(
      {
        email: 'InitialSuperAdmin@Example.test',
        password: 'ValidPassword123!',
        displayName: 'Platform Owner',
      },
      dataSource,
    );

    expect(result.success).toBe(true);
    expect(result.alreadyExisted).toBe(false);
    expect(result.userId).toBeDefined();

    // Verify user record
    const user = await dataSource.getRepository(User).findOne({
      where: { id: result.userId },
      select: { id: true, email: true, displayName: true, status: true, passwordHash: true },
    });

    expect(user).toBeDefined();
    if (!user) {
      throw new Error('Expected user to be defined');
    }
    expect(user.email).toBe('initialsuperadmin@example.test');
    expect(user.displayName).toBe('Platform Owner');
    expect(user.status).toBe('active');
    expect(user.passwordHash).toContain('$argon2id$');

    // Verify user role assignment
    const assignment = await dataSource.getRepository(UserRoleAssignment).findOne({
      where: { userId: result.userId },
      relations: { role: true },
    });

    expect(assignment).toBeDefined();
    if (!assignment) {
      throw new Error('Expected assignment to be defined');
    }
    expect(assignment.role.key).toBe('super_admin');
    expect(assignment.scopeType).toBe('platform');
    expect(assignment.siteId).toBeNull();

    // Verify audit event
    const auditEvents = await dataSource.getRepository(AuditEvent).find({
      where: { action: 'auth.bootstrap' },
    });

    expect(auditEvents.length).toBeGreaterThanOrEqual(1);
    const event = auditEvents[0];
    if (!event) {
      throw new Error('Expected audit event to be defined');
    }
    expect(event.actorType).toBe('bootstrap');
    expect(event.entityId).toBe(result.userId);
    expect(event.metadata).toEqual({
      email: 'initialsuperadmin@example.test',
      role: 'super_admin',
    });
    // Never leaks the password in metadata
    expect(JSON.stringify(event.metadata)).not.toContain('ValidPassword123!');
  });

  it('is idempotent when re-run for the same Super Admin email', async () => {
    const result = await bootstrapSuperAdmin(
      {
        email: 'initialsuperadmin@example.test',
        password: 'ValidPassword123!',
        displayName: 'Platform Owner',
      },
      dataSource,
    );

    expect(result.success).toBe(true);
    expect(result.alreadyExisted).toBe(true);
  });

  it('fails safely and prevents hijacking if a different Super Admin already exists', async () => {
    await expect(
      bootstrapSuperAdmin(
        {
          email: 'attacker@example.test',
          password: 'AttackerPassword123!',
          displayName: 'Attacker',
        },
        dataSource,
      ),
    ).rejects.toThrow(/A different active Super Admin already exists/);
  });
});
