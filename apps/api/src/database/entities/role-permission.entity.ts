import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Permission } from './permission.entity';
import { Role } from './role.entity';

/**
 * Join table between roles and permissions. Both foreign keys are single-column,
 * so the composite primary key doubles as the uniqueness constraint.
 *
 * Deleting a role removes its grants (`CASCADE` on a genuine owned child);
 * deleting a permission is restricted while any role still references it.
 */
@Entity({ name: 'role_permissions' })
export class RolePermission {
  @PrimaryColumn({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @PrimaryColumn({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
