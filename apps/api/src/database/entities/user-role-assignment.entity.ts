import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { Role } from './role.entity';
import { Site } from './site.entity';
import type { RoleScope } from './types';
import { User } from './user.entity';

/**
 * Grants a role to a user, either platform-wide (`site_id IS NULL`) or scoped to
 * one site.
 *
 * `scope_type` is denormalized from `roles` so the composite foreign key
 * `(role_id, scope_type) → roles(id, scope_type)` makes it impossible to assign a
 * platform role to a site or a site role without a site. A check constraint then
 * ties `scope_type` to `site_id`, so the invariant holds at the database level
 * rather than only in a service.
 *
 * This table is also the site-access grant: an Admin's reachable sites are the
 * distinct `site_id` values on their role assignments.
 */
@Entity({ name: 'user_role_assignments' })
@Check(
  'CHK_user_role_assignments_scope',
  '(\n        ("scope_type" = \'platform\' AND "site_id" IS NULL)\n        OR ("scope_type" = \'site\' AND "site_id" IS NOT NULL)\n     )',
)
@Index('IDX_user_role_assignments_user_site', ['userId', 'siteId'])
@Index('IDX_user_role_assignments_site', ['siteId'])
export class UserRoleAssignment {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'scope_type', type: 'text' })
  scopeType!: RoleScope;

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId!: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Site, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'site_id' })
  site!: Site | null;
}
