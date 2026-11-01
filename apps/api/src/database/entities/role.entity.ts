import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { RolePermission } from './role-permission.entity';
import type { RoleScope } from './types';

/**
 * A named bundle of permissions. Authorization checks permission keys through
 * `role_permissions`; it never branches on a role key or display name.
 *
 * `scope_type` decides whether assignments of this role are platform-wide
 * (`super_admin`) or require a site (`admin`, and later `editor` / `author`).
 * The composite unique key `(id, scope_type)` exists so assignments can enforce
 * the scope with a foreign key rather than a trigger.
 */
@Entity({ name: 'roles' })
@Check('CHK_roles_scope_type', "\"scope_type\" IN ('platform', 'site')")
export class Role {
  @PrimaryColumn('uuid', { default: () => 'gen_random_uuid()' })
  id!: string;

  @Column({ type: 'citext', unique: true })
  key!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'scope_type', type: 'text' })
  scopeType!: RoleScope;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions!: RolePermission[];
}
