import { In, IsNull, Not, type EntityManager } from 'typeorm';

import { AuditEvent } from '../entities/audit-event.entity';
import { PostPublication } from '../entities/post-publication.entity';
import { Post } from '../entities/post.entity';
import { Role } from '../entities/role.entity';
import { Site } from '../entities/site.entity';
import { UserRoleAssignment } from '../entities/user-role-assignment.entity';
import { User } from '../entities/user.entity';

export interface AccountSpec {
  readonly email: string;
  readonly displayName: string;
  /** Required to create the account; when set for an existing one, replaces its password. */
  readonly passwordHash: string | null;
}

export interface PlatformAccountsReport {
  superAdminId: string;
  clientAdminId: string;
  postsDeleted: number;
  usersRemoved: string[];
}

const audit = (manager: EntityManager, action: string, entityId: string | null, metadata: object) =>
  manager.getRepository(AuditEvent).save(
    manager.getRepository(AuditEvent).create({
      actorId: null,
      actorType: 'system',
      siteId: null,
      action,
      entityType: 'user',
      entityId,
      requestId: null,
      ipAddress: null,
      metadata,
    }),
  );

async function ensureUser(manager: EntityManager, spec: AccountSpec): Promise<User> {
  const users = manager.getRepository(User);
  const email = spec.email.trim().toLowerCase();
  const existing = await users.findOne({ where: { email } });
  if (existing) {
    existing.displayName = spec.displayName;
    existing.status = 'active';
    existing.failedLoginCount = 0;
    existing.lockedUntil = null;
    if (spec.passwordHash) existing.passwordHash = spec.passwordHash;
    return users.save(existing);
  }
  if (!spec.passwordHash) {
    throw new Error(`A password is required to create ${email}.`);
  }
  return users.save(
    users.create({
      email,
      displayName: spec.displayName,
      passwordHash: spec.passwordHash,
      status: 'active',
    }),
  );
}

async function ensureAssignment(
  manager: EntityManager,
  userId: string,
  role: Role,
  siteId: string | null,
): Promise<void> {
  const assignments = manager.getRepository(UserRoleAssignment);
  const exists = await assignments.exists({
    where: { userId, roleId: role.id, siteId: siteId ?? IsNull() },
  });
  if (!exists) {
    await assignments.save(
      assignments.create({ userId, roleId: role.id, scopeType: role.scopeType, siteId }),
    );
  }
}

/**
 * Brings the platform to the agreed account model: exactly one Super Admin
 * (the operator) and one site Admin (the client) on the given sites.
 * Optionally deletes every post (publications, revisions, comments and
 * taxonomy links cascade) and every other user account. Media is kept.
 * Run inside a transaction so a failure leaves nothing half-done.
 */
export async function applyPlatformAccounts(
  manager: EntityManager,
  options: {
    superAdmin: AccountSpec;
    clientAdmin: AccountSpec;
    clientSiteKeys: readonly string[];
    purgePosts: boolean;
    removeOtherUsers: boolean;
  },
): Promise<PlatformAccountsReport> {
  const roles = manager.getRepository(Role);
  const superRole = await roles.findOne({ where: { key: 'super_admin', scopeType: 'platform' } });
  const adminRole = await roles.findOne({ where: { key: 'admin', scopeType: 'site' } });
  if (!superRole || !adminRole) {
    throw new Error('Built-in roles are missing. Run migrations and the platform seed first.');
  }

  const sites = await manager
    .getRepository(Site)
    .find({ where: { key: In([...options.clientSiteKeys]) } });
  const missing = options.clientSiteKeys.filter((key) => !sites.some((site) => site.key === key));
  if (missing.length > 0) throw new Error(`Sites not found: ${missing.join(', ')}`);

  const superAdmin = await ensureUser(manager, options.superAdmin);
  await ensureAssignment(manager, superAdmin.id, superRole, null);

  const clientAdmin = await ensureUser(manager, options.clientAdmin);
  for (const site of sites) await ensureAssignment(manager, clientAdmin.id, adminRole, site.id);

  let postsDeleted = 0;
  if (options.purgePosts) {
    const postIds = (await manager.getRepository(Post).find({ select: { id: true } })).map(
      (p) => p.id,
    );
    if (postIds.length > 0) {
      await manager.getRepository(PostPublication).delete({ postId: In(postIds) });
      await manager.getRepository(Post).delete({ id: In(postIds) });
    }
    postsDeleted = postIds.length;
    await audit(manager, 'content.purge_posts', null, { postsDeleted });
  }

  const usersRemoved: string[] = [];
  if (options.removeOtherUsers) {
    const keep = [superAdmin.id, clientAdmin.id];
    const others = await manager.getRepository(User).find({ where: { id: Not(In(keep)) } });
    if (others.length > 0) {
      const otherIds = others.map((user) => user.id);
      // Anything they authored now belongs to the client (posts are purged
      // first when requested, so this only covers posts that were kept).
      await manager
        .getRepository(Post)
        .update({ authorId: In(otherIds) }, { authorId: clientAdmin.id });
      await manager.query(
        `UPDATE "post_revisions" SET "created_by" = $1 WHERE "created_by" = ANY($2::uuid[])`,
        [clientAdmin.id, otherIds],
      );
      // Audit history must survive: rows by removed users keep who acted in
      // metadata.removedActor and become 'system' rows (actor_id is cleared).
      for (const user of others) {
        await manager.query(
          `UPDATE "audit_events"
              SET "actor_type" = 'system',
                  "metadata" = "metadata" || jsonb_build_object('removedActor', $2::text)
            WHERE "actor_id" = $1 AND "actor_type" = 'user'`,
          [user.id, user.email],
        );
      }
      await manager.getRepository(UserRoleAssignment).delete({ userId: In(otherIds) });
      await manager.getRepository(User).delete({ id: In(otherIds) });
      usersRemoved.push(...others.map((user) => user.email));
    }
    // The Super Admin keeps only the platform role; the client only site roles.
    await manager.getRepository(UserRoleAssignment).delete({
      userId: clientAdmin.id,
      roleId: Not(adminRole.id),
    });
    await audit(manager, 'auth.accounts_reset', null, { usersRemoved });
  }

  await audit(manager, 'auth.accounts_ensured', clientAdmin.id, {
    superAdmin: superAdmin.email,
    clientAdmin: clientAdmin.email,
    clientSites: options.clientSiteKeys,
  });

  return { superAdminId: superAdmin.id, clientAdminId: clientAdmin.id, postsDeleted, usersRemoved };
}
